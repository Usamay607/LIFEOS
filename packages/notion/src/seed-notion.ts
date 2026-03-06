import { Client } from "@notionhq/client";
import { createStarterSnapshot } from "./seed";
import { loadLosEnv } from "./env";

function title(content: string) {
  return { title: [{ type: "text", text: { content } }] };
}

function richText(content: string) {
  return { rich_text: [{ type: "text", text: { content } }] };
}

async function run() {
  const env = loadLosEnv();
  if (!env.notionToken) {
    throw new Error("NOTION_TOKEN is required");
  }

  const required = [
    "areas",
    "entities",
    "pathways",
    "coursesCerts",
    "projects",
    "tasks",
    "accounts",
    "transactions",
    "upcomingExpenses",
    "metrics",
    "healthLogs",
    "workouts",
    "familyEvents",
    "relationshipCheckins",
    "timeOffPlans",
    "journalEntries",
    "reviews",
  ] as const;

  for (const key of required) {
    if (!env.databaseIds[key]) {
      throw new Error(`Missing NOTION_DATABASE_${key.toUpperCase()}_ID`);
    }
  }

  const snapshot = createStarterSnapshot();
  const notion = new Client({ auth: env.notionToken });
  const notionAny = notion as any;

  const areaMap = new Map<string, string>();
  const entityMap = new Map<string, string>();
  const pathwayMap = new Map<string, string>();
  const courseMap = new Map<string, string>();
  const projectMap = new Map<string, string>();

  for (const area of snapshot.areas) {
    const page = (await notionAny.pages.create({
      parent: { database_id: env.databaseIds.areas! },
      properties: {
        name: title(area.name),
        color: { select: { name: area.color } },
        active: { checkbox: area.active },
      },
    })) as any;
    areaMap.set(area.id, page.id);
  }

  for (const entity of snapshot.entities) {
    const page = (await notionAny.pages.create({
      parent: { database_id: env.databaseIds.entities! },
      properties: {
        name: title(entity.name),
        area: { relation: [{ id: areaMap.get(entity.areaId)! }] },
        type: { select: { name: entity.type } },
        status: { select: { name: entity.status } },
        priority: { number: entity.priority },
        notes: richText(entity.notes ?? ""),
      },
    })) as any;
    entityMap.set(entity.id, page.id);
  }

  for (const pathway of snapshot.pathways) {
    const page = (await notionAny.pages.create({
      parent: { database_id: env.databaseIds.pathways! },
      properties: {
        title: title(pathway.title),
        status: { select: { name: pathway.status } },
        progress_percent: { number: pathway.progressPercent },
      },
    })) as any;
    pathwayMap.set(pathway.id, page.id);
  }

  for (const course of snapshot.courses) {
    const page = (await notionAny.pages.create({
      parent: { database_id: env.databaseIds.coursesCerts! },
      properties: {
        course_cert: title(course.title),
        pathway: { relation: [{ id: pathwayMap.get(course.pathwayId)! }] },
        status: { select: { name: course.status } },
        target_date: course.targetDate ? { date: { start: course.targetDate } } : undefined,
        estimated_hours: { number: course.estimatedHours ?? null },
        completed_hours: { number: course.completedHours ?? null },
        applied_progress_percent: { number: course.appliedProgressPercent },
      },
    })) as any;
    courseMap.set(course.id, page.id);
  }

  for (const project of snapshot.projects) {
    const page = (await notionAny.pages.create({
      parent: { database_id: env.databaseIds.projects! },
      properties: {
        name: title(project.name),
        entity: { relation: [{ id: entityMap.get(project.entityId)! }] },
        status: { select: { name: project.status } },
        next_milestone: richText(project.nextMilestone ?? ""),
        deadline: project.deadline ? { date: { start: project.deadline } } : undefined,
        skills_used: {
          relation: project.skillsUsedCourseIds.map((courseId) => ({ id: courseMap.get(courseId)! })),
        },
        post_mortem: richText(project.postMortem ?? ""),
      },
    })) as any;
    projectMap.set(project.id, page.id);
  }

  for (const course of snapshot.courses) {
    await notionAny.pages.update({
      page_id: courseMap.get(course.id)!,
      properties: {
        applied_projects: {
          relation: course.appliedProjectIds.map((projectId) => ({ id: projectMap.get(projectId)! })),
        },
      },
    });
  }

  for (const task of snapshot.tasks) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.tasks! },
      properties: {
        title: title(task.title),
        project: { relation: [{ id: projectMap.get(task.projectId)! }] },
        status: { select: { name: task.status } },
        due_date: task.dueDate ? { date: { start: task.dueDate } } : undefined,
        energy: { select: { name: task.energy } },
        context: { select: { name: task.context } },
        recurring: { checkbox: task.recurring },
        notes: richText(task.notes ?? ""),
        created_at: { date: { start: task.createdAt } },
      },
    });
  }

  for (const account of snapshot.accounts) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.accounts! },
      properties: {
        service: title(account.service),
        entity: { relation: [{ id: entityMap.get(account.entityId)! }] },
        login_identifier: richText(account.loginIdentifier),
        role: { select: { name: account.role } },
        "2fa_enabled": { checkbox: account.twoFactorEnabled },
        vault_item_url: richText(account.vaultItemUrl),
        vault_item_id: richText(account.vaultItemId ?? ""),
        last_rotated: account.lastRotated ? { date: { start: account.lastRotated } } : undefined,
        notes: richText(account.notes ?? ""),
      },
    });
  }

  for (const transaction of snapshot.transactions) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.transactions! },
      properties: {
        date: { date: { start: transaction.date } },
        amount: { number: transaction.amount },
        type: { select: { name: transaction.type } },
        entity: { relation: [{ id: entityMap.get(transaction.entityId)! }] },
        category: { select: { name: transaction.category } },
        notes: richText(transaction.notes ?? ""),
      },
    });
  }

  for (const expense of snapshot.upcomingExpenses) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.upcomingExpenses! },
      properties: {
        bill: title(expense.bill),
        amount: { number: expense.amount },
        due_date: { date: { start: expense.dueDate } },
        frequency: { select: { name: expense.frequency } },
        entity: { relation: [{ id: entityMap.get(expense.entityId)! }] },
        paid: { checkbox: false },
      },
    });
  }

  for (const metric of snapshot.metrics) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.metrics! },
      properties: {
        metric_name: title(metric.metricName),
        category: { select: { name: metric.category } },
        value: { number: metric.value },
        unit: { select: { name: metric.unit } },
        date: { date: { start: metric.date } },
        entity: metric.entityId ? { relation: [{ id: entityMap.get(metric.entityId)! }] } : undefined,
      },
    });
  }

  for (const log of snapshot.healthLogs) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.healthLogs! },
      properties: {
        date: { date: { start: log.date } },
        entity: { relation: [{ id: entityMap.get(log.entityId)! }] },
        steps: { number: log.steps },
        sleep_hours: { number: log.sleepHours },
        resting_hr: { number: log.restingHeartRate },
        hydration_liters: { number: log.hydrationLiters },
        recovery_score: { number: log.recoveryScore },
        weight_kg: { number: log.weightKg ?? null },
      },
    });
  }

  for (const workout of snapshot.workouts) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.workouts! },
      properties: {
        date: { date: { start: workout.date } },
        entity: { relation: [{ id: entityMap.get(workout.entityId)! }] },
        session_type: { select: { name: workout.sessionType } },
        intensity: { select: { name: workout.intensity } },
        duration_minutes: { number: workout.durationMinutes },
        volume_load_kg: { number: workout.volumeLoadKg ?? null },
        notes: richText(workout.notes ?? ""),
      },
    });
  }

  for (const event of snapshot.familyEvents) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.familyEvents! },
      properties: {
        title: title(event.title),
        date: { date: { start: event.date } },
        category: { select: { name: event.category } },
        importance: { select: { name: event.importance } },
        entity: event.entityId ? { relation: [{ id: entityMap.get(event.entityId)! }] } : undefined,
        notes: richText(event.notes ?? ""),
      },
    });
  }

  for (const checkin of snapshot.relationshipCheckins) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.relationshipCheckins! },
      properties: {
        person: title(checkin.person),
        relation_type: { select: { name: checkin.relationType } },
        last_meaningful_contact: { date: { start: checkin.lastMeaningfulContact } },
        target_cadence_days: { number: checkin.targetCadenceDays },
        entity: checkin.entityId ? { relation: [{ id: entityMap.get(checkin.entityId)! }] } : undefined,
        notes: richText(checkin.notes ?? ""),
      },
    });
  }

  for (const plan of snapshot.timeOffPlans) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.timeOffPlans! },
      properties: {
        title: title(plan.title),
        status: { select: { name: plan.status } },
        target_date: plan.targetDate ? { date: { start: plan.targetDate } } : undefined,
        estimated_cost_aud: { number: plan.estimatedCostAud },
        priority: { select: { name: plan.priority } },
        entity: plan.entityId ? { relation: [{ id: entityMap.get(plan.entityId)! }] } : undefined,
        notes: richText(plan.notes ?? ""),
      },
    });
  }

  for (const entry of snapshot.journalEntries) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.journalEntries! },
      properties: {
        title: title(entry.title),
        date: { date: { start: entry.date } },
        entry: richText(entry.entry),
        mood: { select: { name: entry.mood } },
        tags: { multi_select: entry.tags.map((tag) => ({ name: tag })) },
        entity: entry.entityId ? { relation: [{ id: entityMap.get(entry.entityId)! }] } : undefined,
        energy_score: { number: entry.energyScore ?? null },
        focus_score: { number: entry.focusScore ?? null },
      },
    });
  }

  for (const review of snapshot.reviews) {
    await notionAny.pages.create({
      parent: { database_id: env.databaseIds.reviews! },
      properties: {
        review_date: { date: { start: review.reviewDate } },
        wins: richText(review.wins.join(" | ")),
        stuck: richText(review.stuck.join(" | ")),
        top_three_next_week: richText(review.topThreeNextWeek.join(" | ")),
        runway_commentary: richText(review.runwayCommentary),
      },
    });
  }

  console.log("Seeded LOS starter pack to Notion successfully.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
