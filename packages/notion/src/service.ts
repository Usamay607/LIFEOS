import { Client } from "@notionhq/client";
import type {
  AccountRef,
  AssistantQueryRequest,
  AssistantQueryResponse,
  CourseCert,
  CreateEntityInput,
  FocusState,
  CreateJournalEntryInput,
  CreateTaskInput,
  Entity,
  FamilyEvent,
  FamilyOverview,
  HealthDailyLog,
  HealthOverview,
  HomeDashboardData,
  JournalEntry,
  LearningOverview,
  LosDataSnapshot,
  Pathway,
  Project,
  RedactionLevel,
  SystemReadiness,
  RunwayResult,
  Task,
  TaskCompletedWebhookRequest,
  TimeOffPlan,
  Transaction,
  TransitionOverview,
  UpsertFocusStateInput,
  UpcomingExpense,
  UpdateEntityInput,
  UpdateTaskInput,
  WeeklySummaryRequest,
  WeeklySummaryResponse,
  WorkoutSession,
  RelationshipCheckin,
} from "@los/types";
import { loadLosEnv, type LosEnv } from "./env";
import { memoryStore } from "./memory-store";
import {
  mapNotionPageToAccount,
  mapNotionPageToArea,
  mapNotionPageToCourse,
  mapNotionPageToEntity,
  mapNotionPageToFamilyEvent,
  mapNotionPageToHealthLog,
  mapNotionPageToJournalEntry,
  mapNotionPageToMetric,
  mapNotionPageToPathway,
  mapNotionPageToProject,
  mapNotionPageToTask,
  mapNotionPageToTransaction,
  mapNotionPageToUpcomingExpense,
  mapNotionPageToWorkout,
  mapNotionPageToRelationshipCheckin,
  mapNotionPageToTimeOffPlan,
  textProperty,
  titleProperty,
} from "./notion-helpers";
import { redactAccountsForSummary } from "./redaction";
import { assertProjectIntegrity, assertTaskCreateIntegrity, assertTaskUpdateIntegrity } from "./validators";

const DAY_MS = 86_400_000;
const REQUIRED_DATABASE_KEYS: Array<keyof LosEnv["databaseIds"]> = [
  "areas",
  "entities",
  "projects",
  "tasks",
  "pathways",
  "coursesCerts",
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
];

function toIso(value?: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayKey(date: string | Date, timezone: string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(value);
}

export class LosService {
  private readonly env: LosEnv;
  private readonly notion: Client | null;

  constructor(env: LosEnv = loadLosEnv()) {
    this.env = env;
    this.notion = env.dataMode === "notion" && env.notionToken ? new Client({ auth: env.notionToken }) : null;
  }

  getDataMode(): "mock" | "notion" {
    return this.env.dataMode;
  }

  async getSystemReadiness(): Promise<SystemReadiness> {
    const missingDatabases = REQUIRED_DATABASE_KEYS.filter((key) => !this.env.databaseIds[key]);
    const configuredDatabases = REQUIRED_DATABASE_KEYS.length - missingDatabases.length;
    const notionTokenConfigured = Boolean(this.env.notionToken);
    const openAiConfigured = Boolean(this.env.openAiApiKey);

    let connectivity: SystemReadiness["connectivity"] = "skipped";
    let connectivityError: string | undefined;

    if (this.env.dataMode === "notion") {
      if (!notionTokenConfigured || missingDatabases.length > 0) {
        connectivity = "error";
        connectivityError = "Notion token and all database IDs are required in notion mode.";
      } else {
        try {
          await this.listAreas(false);
          connectivity = "ok";
        } catch (error) {
          connectivity = "error";
          connectivityError = error instanceof Error ? error.message : "Failed to query Notion.";
        }
      }
    }

    const [entities, projects, tasks, journalEntries] = await Promise.all([
      this.listEntities(false),
      this.listProjects(),
      this.listTasks(),
      this.listJournalEntries(),
    ]);

    const startupReady =
      this.env.dataMode === "mock"
        ? true
        : notionTokenConfigured && missingDatabases.length === 0 && connectivity === "ok";

    return {
      generatedAt: new Date().toISOString(),
      dataMode: this.env.dataMode,
      notionTokenConfigured,
      openAiConfigured,
      requiredDatabasesTotal: REQUIRED_DATABASE_KEYS.length,
      configuredDatabases,
      missingDatabases,
      connectivity,
      connectivityError,
      dataCounts: {
        entities: entities.length,
        projects: projects.length,
        tasks: tasks.length,
        journalEntries: journalEntries.length,
      },
      startupReady,
    };
  }

  resetMockData(): void {
    memoryStore.reset();
  }

  async getHomeDashboard(): Promise<HomeDashboardData> {
    const [
      projects,
      tasks,
      runway,
      upcomingExpenses,
      pendingTransactions,
      healthOverview,
      familyOverview,
      transitionOverview,
      learningOverview,
    ] = await Promise.all([
      this.listProjects("ACTIVE"),
      this.listTasks(),
      this.getRunway(),
      this.listUpcomingExpenses(),
      this.listPendingTransactions(),
      this.getHealthOverview(),
      this.getFamilyOverview(),
      this.getTransitionOverview(),
      this.getLearningOverview(),
    ]);

    const nextTasks = tasks
      .filter((task) => task.status === "NEXT" || task.status === "DOING")
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
      .slice(0, 5);

    const topProjects = projects
      .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))
      .slice(0, 3);

    return {
      generatedAt: new Date().toISOString(),
      topProjects,
      nextTasks,
      runway,
      healthOverview,
      familyOverview,
      transitionOverview,
      learningOverview,
      upcomingExpenses,
      pendingTransactions,
    };
  }

  async getHealthOverview(): Promise<HealthOverview> {
    const [logs, workouts] = await Promise.all([this.listHealthLogs(14), this.listWorkouts(14)]);
    const latestLog = logs[0];
    const recentLogs = logs.slice(0, 7);
    const recentWorkouts = workouts.slice(0, 7);

    const average = (values: number[]) => (values.length ? round2(sum(values) / values.length) : 0);

    const weeklyAverages = {
      steps: average(recentLogs.map((log) => log.steps)),
      sleepHours: average(recentLogs.map((log) => log.sleepHours)),
      restingHeartRate: average(recentLogs.map((log) => log.restingHeartRate)),
      hydrationLiters: average(recentLogs.map((log) => log.hydrationLiters)),
      recoveryScore: average(recentLogs.map((log) => log.recoveryScore)),
    };

    const previousLogs = logs.slice(7, 14);
    const previousAverages = {
      steps: average(previousLogs.map((log) => log.steps)),
      sleepHours: average(previousLogs.map((log) => log.sleepHours)),
      recoveryScore: average(previousLogs.map((log) => log.recoveryScore)),
    };

    const byType: HealthOverview["byType"] = {
      STRENGTH: 0,
      CARDIO: 0,
      MOBILITY: 0,
      SPORT: 0,
      RECOVERY: 0,
    };

    for (const workout of recentWorkouts) {
      byType[workout.sessionType] += 1;
    }

    return {
      generatedAt: new Date().toISOString(),
      latestLog,
      weeklyAverages,
      workoutsThisWeek: recentWorkouts.length,
      trainingMinutesThisWeek: sum(recentWorkouts.map((workout) => workout.durationMinutes)),
      byType,
      trend: {
        stepsDelta: round2(weeklyAverages.steps - previousAverages.steps),
        sleepDelta: round2(weeklyAverages.sleepHours - previousAverages.sleepHours),
        recoveryDelta: round2(weeklyAverages.recoveryScore - previousAverages.recoveryScore),
      },
    };
  }

  async getFamilyOverview(): Promise<FamilyOverview> {
    const [events, checkins] = await Promise.all([this.listFamilyEvents(45), this.listRelationshipCheckins()]);
    const nowMs = Date.now();

    const upcomingEvents = events
      .filter((event) => new Date(event.date).getTime() >= nowMs)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    const normalizedCheckins = checkins
      .map((checkin) => {
        const daysSinceContact = Math.floor((nowMs - new Date(checkin.lastMeaningfulContact).getTime()) / DAY_MS);
        const isOverdue = daysSinceContact > checkin.targetCadenceDays;
        return {
          ...checkin,
          daysSinceContact,
          isOverdue,
        };
      })
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact);

    const overdueRelationships = normalizedCheckins.filter((item) => item.isOverdue).slice(0, 5);
    const dueSoonRelationships = normalizedCheckins
      .filter((item) => !item.isOverdue && item.daysSinceContact >= item.targetCadenceDays - 2)
      .slice(0, 5);

    return {
      generatedAt: new Date().toISOString(),
      upcomingEvents,
      overdueRelationships,
      dueSoonRelationships,
    };
  }

  async getTransitionOverview(): Promise<TransitionOverview> {
    const [runway, plans] = await Promise.all([this.getRunway(), this.listTimeOffPlans()]);
    const preSabbaticalPlans = plans.filter((plan) => plan.status === "PRE_SABBATICAL" || plan.status === "READY");
    const readyPlans = preSabbaticalPlans.filter((plan) => plan.status === "READY").length;
    const readinessScore = preSabbaticalPlans.length
      ? round2((readyPlans / preSabbaticalPlans.length) * 100)
      : 0;

    const atRiskPlans = preSabbaticalPlans
      .filter((plan) => {
        if (!plan.targetDate) return false;
        const daysLeft = Math.ceil((new Date(plan.targetDate).getTime() - Date.now()) / DAY_MS);
        return daysLeft <= 14 && plan.status !== "READY";
      })
      .slice(0, 5);

    const projectedFreedomDate =
      runway.monthsOfFreedom > 0
        ? new Date(Date.now() + Math.round(runway.monthsOfFreedom * 30) * DAY_MS).toISOString()
        : undefined;

    return {
      generatedAt: new Date().toISOString(),
      runwayMonths: runway.monthsOfFreedom,
      projectedFreedomDate,
      readinessScore,
      preSabbaticalPlans: preSabbaticalPlans.slice(0, 6),
      atRiskPlans,
    };
  }

  async getLearningOverview(): Promise<LearningOverview> {
    const [pathways, courses] = await Promise.all([this.listPathways(), this.listCourses()]);

    const activePathways = pathways
      .filter((pathway) => pathway.status === "ACTIVE")
      .map((pathway) => {
        const linkedCourses = courses.filter((course) => course.pathwayId === pathway.id);
        const coursesInProgress = linkedCourses.filter(
          (course) => course.status === "IN_PROGRESS" || course.status === "COMPLETED",
        ).length;
        return {
          ...pathway,
          coursesInProgress,
          totalCourses: linkedCourses.length,
        };
      })
      .sort((a, b) => b.progressPercent - a.progressPercent);

    const nowMs = Date.now();
    const upcomingCourseDeadlines = courses
      .filter((course) => course.status !== "COMPLETED" && course.targetDate)
      .map((course) => {
        const dueMs = new Date(course.targetDate!).getTime();
        const daysUntilDue = Math.ceil((dueMs - nowMs) / DAY_MS);
        return {
          ...course,
          daysUntilDue,
          atRisk: daysUntilDue <= 7 || (course.estimatedHours ?? 0) > 0 && (course.completedHours ?? 0) / (course.estimatedHours ?? 1) < 0.5 && daysUntilDue <= 14,
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 6);

    const progressRatios = courses
      .filter((course) => (course.estimatedHours ?? 0) > 0)
      .map((course) => Math.min(1, (course.completedHours ?? 0) / (course.estimatedHours ?? 1)));

    const completionRatio = progressRatios.length ? round2(sum(progressRatios) / progressRatios.length) : 0;
    const averageAppliedProgress = courses.length
      ? round2(sum(courses.map((course) => course.appliedProgressPercent)) / courses.length) / 100
      : 0;

    const impactScore = round2((completionRatio * 0.6 + averageAppliedProgress * 0.4) * 100);

    return {
      generatedAt: new Date().toISOString(),
      activePathways: activePathways.slice(0, 6),
      upcomingCourseDeadlines,
      impactScore,
    };
  }

  async listEntities(includeArchived = true): Promise<Entity[]> {
    if (!this.notion) {
      const entities = memoryStore.get().entities;
      return includeArchived ? entities : entities.filter((entity) => entity.status !== "ARCHIVED");
    }

    const entitiesDbId = this.requireDatabaseId("entities");
    const response = await this.queryAllPages(entitiesDbId);
    const entities = response.map(mapNotionPageToEntity);
    return includeArchived ? entities : entities.filter((entity) => entity.status !== "ARCHIVED");
  }

  async listAreas(activeOnly = true): Promise<LosDataSnapshot["areas"]> {
    if (!this.notion) {
      const areas = memoryStore.get().areas;
      return activeOnly ? areas.filter((area) => area.active) : areas;
    }

    const dbId = this.requireDatabaseId("areas");
    const pages = await this.queryAllPages(dbId);
    const areas = pages.map(mapNotionPageToArea);
    return activeOnly ? areas.filter((area) => area.active) : areas;
  }

  async updateEntity(id: string, input: UpdateEntityInput): Promise<Entity> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const entityIndex = snapshot.entities.findIndex((entity) => entity.id === id);
      if (entityIndex < 0) {
        throw new Error(`Entity not found: ${id}`);
      }
      const existing = snapshot.entities[entityIndex];
      if (!existing) {
        throw new Error(`Entity not found: ${id}`);
      }
      const updated: Entity = { ...existing, ...input };
      snapshot.entities[entityIndex] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.name) {
      properties.name = titleProperty(input.name);
    }
    if (input.status) {
      properties.status = { select: { name: input.status } };
    }
    if (typeof input.priority === "number") {
      properties.priority = { number: input.priority };
    }
    if (typeof input.notes === "string") {
      properties.notes = textProperty(input.notes);
    }

    const page = (await (this.notion as any).pages.update({
      page_id: id,
      properties,
    })) as any;

    return mapNotionPageToEntity(page);
  }

  async createEntity(input: CreateEntityInput): Promise<Entity> {
    if (!input.name.trim()) {
      throw new Error("Entity name is required.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const entity: Entity = {
        id: `ent_${crypto.randomUUID()}`,
        name: input.name,
        areaId: input.areaId,
        type: input.type,
        status: input.status ?? "ACTIVE",
        priority: input.priority ?? 3,
        notes: input.notes,
      };
      snapshot.entities.unshift(entity);
      return entity;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("entities") },
      properties: {
        name: titleProperty(input.name),
        area: { relation: [{ id: input.areaId }] },
        type: { select: { name: input.type } },
        status: { select: { name: input.status ?? "ACTIVE" } },
        priority: { number: input.priority ?? 3 },
        notes: textProperty(input.notes ?? ""),
      },
    })) as any;

    return mapNotionPageToEntity(page);
  }

  async listProjects(status?: Project["status"]): Promise<Project[]> {
    if (!this.notion) {
      const projects = memoryStore.get().projects;
      return status ? projects.filter((project) => project.status === status) : projects;
    }

    const projectsDbId = this.requireDatabaseId("projects");
    const filter = status
      ? {
          property: "status",
          select: {
            equals: status,
          },
        }
      : undefined;

    const response = await this.queryAllPages(projectsDbId, filter);
    const projects = response.map(mapNotionPageToProject);
    projects.forEach(assertProjectIntegrity);
    return projects;
  }

  async listTasks(): Promise<Task[]> {
    if (!this.notion) {
      return memoryStore.get().tasks;
    }

    const tasksDbId = this.requireDatabaseId("tasks");
    const response = await this.queryAllPages(tasksDbId);
    return response.map(mapNotionPageToTask);
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const projects = await this.listProjects();
    assertTaskCreateIntegrity(input, projects);

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const task: Task = {
        id: `task_${crypto.randomUUID()}`,
        title: input.title,
        projectId: input.projectId,
        status: "NEXT",
        dueDate: toIso(input.dueDate),
        energy: input.energy,
        context: input.context,
        recurring: input.recurring,
        notes: input.notes,
        createdAt: new Date().toISOString(),
      };
      snapshot.tasks.unshift(task);
      return task;
    }

    const tasksDbId = this.requireDatabaseId("tasks");
    const page = (await (this.notion as any).pages.create({
      parent: { database_id: tasksDbId },
      properties: {
        title: titleProperty(input.title),
        project: { relation: [{ id: input.projectId }] },
        status: { select: { name: "NEXT" } },
        due_date: input.dueDate ? { date: { start: input.dueDate } } : undefined,
        energy: { select: { name: input.energy } },
        context: { select: { name: input.context } },
        recurring: { checkbox: input.recurring },
        notes: textProperty(input.notes ?? ""),
        created_at: { date: { start: new Date().toISOString() } },
      },
    })) as any;

    return mapNotionPageToTask(page);
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.tasks.findIndex((task) => task.id === id);
      if (index < 0) {
        throw new Error(`Task not found: ${id}`);
      }
      const existing = snapshot.tasks[index];
      if (!existing) {
        throw new Error(`Task not found: ${id}`);
      }
      assertTaskUpdateIntegrity(existing, input);
      const updated: Task = {
        ...existing,
        ...input,
        dueDate: input.dueDate ? toIso(input.dueDate) : existing.dueDate,
      };
      snapshot.tasks[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.status) properties.status = { select: { name: input.status } };
    if (input.dueDate) properties.due_date = { date: { start: input.dueDate } };
    if (input.energy) properties.energy = { select: { name: input.energy } };
    if (input.context) properties.context = { select: { name: input.context } };
    if (typeof input.recurring === "boolean") properties.recurring = { checkbox: input.recurring };
    if (typeof input.notes === "string") properties.notes = textProperty(input.notes);

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToTask(page);
  }

  async createJournalEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
    if (!input.title.trim()) {
      throw new Error("Journal title is required.");
    }
    if (!input.entry.trim()) {
      throw new Error("Journal entry body is required.");
    }

    const sanitizedTags = input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const entry: JournalEntry = {
        id: `journal_${crypto.randomUUID()}`,
        date: toIso(input.date) ?? new Date().toISOString(),
        title: input.title.trim(),
        entry: input.entry.trim(),
        mood: input.mood ?? "NEUTRAL",
        tags: sanitizedTags,
        entityId: input.entityId,
        energyScore: input.energyScore,
        focusScore: input.focusScore,
      };
      snapshot.journalEntries.unshift(entry);
      return entry;
    }

    const properties: Record<string, unknown> = {
      title: titleProperty(input.title.trim()),
      date: { date: { start: input.date ?? new Date().toISOString() } },
      entry: textProperty(input.entry.trim()),
      mood: { select: { name: input.mood ?? "NEUTRAL" } },
      tags: { multi_select: sanitizedTags.map((tag) => ({ name: tag })) },
      energy_score: { number: input.energyScore ?? null },
      focus_score: { number: input.focusScore ?? null },
    };

    if (input.entityId) {
      properties.entity = { relation: [{ id: input.entityId }] };
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("journalEntries") },
      properties,
    })) as any;

    return mapNotionPageToJournalEntry(page);
  }

  async getFocusState(date?: string): Promise<FocusState | null> {
    const focusDate = date && date.trim() ? dayKey(date, this.env.timezone) : dayKey(new Date(), this.env.timezone);

    const parseFocus = (entry: JournalEntry): FocusState | null => {
      if (!entry.tags.includes("LOS_FOCUS")) return null;

      try {
        const payload = JSON.parse(entry.entry) as {
          outcomes?: unknown;
          completed?: unknown;
          nextAction?: unknown;
          blocker?: unknown;
          updatedAt?: unknown;
        };

        const outcomes = Array.isArray(payload.outcomes) ? payload.outcomes.map((item) => (typeof item === "string" ? item : "")) : [];
        const completed = Array.isArray(payload.completed) ? payload.completed.map((item) => item === true) : [];
        if (outcomes.length !== 3 || completed.length !== 3) {
          return null;
        }

        return {
          date: focusDate,
          outcomes,
          completed,
          nextAction: typeof payload.nextAction === "string" ? payload.nextAction : "",
          blocker: typeof payload.blocker === "string" ? payload.blocker : "",
          updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : entry.date,
          journalEntryId: entry.id,
        };
      } catch {
        return null;
      }
    };

    if (!this.notion) {
      const entry = memoryStore
        .get()
        .journalEntries.find((item) => dayKey(item.date, this.env.timezone) === focusDate && item.tags.includes("LOS_FOCUS"));
      return entry ? parseFocus(entry) : null;
    }

    const response = await this.queryAllPages(this.requireDatabaseId("journalEntries"), {
      and: [
        { property: "date", date: { equals: focusDate } },
        { property: "tags", multi_select: { contains: "LOS_FOCUS" } },
      ],
    });
    const entries = response.map(mapNotionPageToJournalEntry).sort((a, b) => b.date.localeCompare(a.date));
    return entries.length > 0 ? parseFocus(entries[0] as JournalEntry) : null;
  }

  async upsertFocusState(input: UpsertFocusStateInput): Promise<FocusState> {
    const focusDate = input.date && input.date.trim() ? dayKey(input.date, this.env.timezone) : dayKey(new Date(), this.env.timezone);
    const outcomes = input.outcomes.slice(0, 3).map((item) => item.trim());
    while (outcomes.length < 3) outcomes.push("");

    const completed = input.completed.slice(0, 3).map((item) => item === true);
    while (completed.length < 3) completed.push(false);

    const nextAction = (input.nextAction ?? "").trim();
    const blocker = (input.blocker ?? "").trim();
    const updatedAt = new Date().toISOString();
    const serialized = JSON.stringify(
      {
        outcomes,
        completed,
        nextAction,
        blocker,
        updatedAt,
      },
      null,
      2,
    );

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const existing = snapshot.journalEntries.find(
        (item) => dayKey(item.date, this.env.timezone) === focusDate && item.tags.includes("LOS_FOCUS"),
      );

      if (existing) {
        existing.title = `Focus ${focusDate}`;
        existing.entry = serialized;
        existing.tags = [...new Set(["LOS_FOCUS", `DAY_${focusDate}`, ...existing.tags])];
        existing.focusScore = completed.filter(Boolean).length * 3;
      } else {
        snapshot.journalEntries.unshift({
          id: `journal_${crypto.randomUUID()}`,
          date: new Date(`${focusDate}T00:00:00.000Z`).toISOString(),
          title: `Focus ${focusDate}`,
          entry: serialized,
          mood: "NEUTRAL",
          tags: ["LOS_FOCUS", `DAY_${focusDate}`],
          focusScore: completed.filter(Boolean).length * 3,
        });
      }

      const resolved = snapshot.journalEntries.find(
        (item) => dayKey(item.date, this.env.timezone) === focusDate && item.tags.includes("LOS_FOCUS"),
      );

      return {
        date: focusDate,
        outcomes,
        completed,
        nextAction,
        blocker,
        updatedAt,
        journalEntryId: resolved?.id,
      };
    }

    const dbId = this.requireDatabaseId("journalEntries");
    const existingPages = await this.queryAllPages(dbId, {
      and: [
        { property: "date", date: { equals: focusDate } },
        { property: "tags", multi_select: { contains: "LOS_FOCUS" } },
      ],
    });
    const existing = existingPages[0] as { id: string } | undefined;

    const properties: Record<string, unknown> = {
      title: titleProperty(`Focus ${focusDate}`),
      date: { date: { start: focusDate } },
      entry: textProperty(serialized),
      mood: { select: { name: "NEUTRAL" } },
      tags: { multi_select: [{ name: "LOS_FOCUS" }, { name: `DAY_${focusDate}` }] },
      focus_score: { number: completed.filter(Boolean).length * 3 },
    };

    const page = existing
      ? ((await (this.notion as any).pages.update({
          page_id: existing.id,
          properties,
        })) as any)
      : ((await (this.notion as any).pages.create({
          parent: { database_id: dbId },
          properties,
        })) as any);

    return {
      date: focusDate,
      outcomes,
      completed,
      nextAction,
      blocker,
      updatedAt,
      journalEntryId: page.id,
    };
  }

  async listPendingTransactions(): Promise<Transaction[]> {
    if (!this.notion) {
      return memoryStore
        .get()
        .transactions.filter((transaction) => transaction.type === "EXPENSE")
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
    }

    const dbId = this.requireDatabaseId("transactions");
    const response = await this.queryAllPages(dbId, {
      property: "type",
      select: { equals: "EXPENSE" },
    });

    return response.map(mapNotionPageToTransaction).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }

  async listUpcomingExpenses(): Promise<UpcomingExpense[]> {
    if (!this.notion) {
      return memoryStore
        .get()
        .upcomingExpenses.filter((expense) => !expense.paid)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);
    }

    const dbId = this.requireDatabaseId("upcomingExpenses");
    const response = await this.queryAllPages(dbId, {
      property: "paid",
      checkbox: { equals: false },
    });

    return response
      .map(mapNotionPageToUpcomingExpense)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }

  async getRunway(): Promise<RunwayResult> {
    const [metrics, transactions] = await Promise.all([this.listMetrics(), this.listTransactions()]);

    const liquidAssetMetric = metrics
      .filter((metric) => metric.metricName.toLowerCase().includes("liquid assets"))
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const liquidAssets = liquidAssetMetric?.value ?? 0;

    const now = Date.now();
    const ninetyDaysAgo = now - DAY_MS * 90;

    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === "EXPENSE" && new Date(transaction.date).getTime() >= ninetyDaysAgo,
    );

    const expenseTotal = sum(expenseTransactions.map((transaction) => transaction.amount));
    const observedMonths = Math.max(1, round2((now - ninetyDaysAgo) / DAY_MS / 30));
    const monthlyBurn = expenseTotal > 0 ? round2(expenseTotal / observedMonths) : 0;
    const monthsOfFreedom = monthlyBurn > 0 ? round2(liquidAssets / monthlyBurn) : 0;

    return {
      liquidAssets: round2(liquidAssets),
      monthlyBurn,
      monthsOfFreedom,
    };
  }

  async generateWeeklySummary(request: WeeklySummaryRequest): Promise<WeeklySummaryResponse> {
    const [tasks, projects, runway] = await Promise.all([this.listTasks(), this.listProjects(), this.getRunway()]);
    const snapshot = await this.getSnapshot();

    const windowStart = Date.now() - request.taskWindowDays * DAY_MS;
    const doneTasks = tasks.filter(
      (task) => task.status === "DONE" && new Date(task.createdAt).getTime() >= windowStart,
    );
    const activeTasks = tasks.filter((task) => task.status === "NEXT" || task.status === "DOING");
    const onHoldProjects = projects.filter((project) => project.status === "ON_HOLD");

    const redactedAccounts = redactAccountsForSummary(snapshot.accounts, request.redactionLevel);

    const summaryPayload = {
      reviewDate: request.reviewDate,
      doneCount: doneTasks.length,
      activeCount: activeTasks.length,
      onHoldProjects: onHoldProjects.map((project) => project.name),
      runway,
      accountCoverage: redactedAccounts.length,
    };

    const summary = this.env.openAiApiKey
      ? await this.generateOpenAiSummary(summaryPayload, request.redactionLevel)
      : this.generateDeterministicSummary(summaryPayload, request.redactionLevel);

    return {
      summary,
      generatedAt: new Date().toISOString(),
      redactionApplied: request.redactionLevel,
    };
  }

  async queryAssistant(request: AssistantQueryRequest): Promise<AssistantQueryResponse> {
    if (!request.question?.trim()) {
      throw new Error("Question is required.");
    }

    const [dashboard, snapshot] = await Promise.all([this.getHomeDashboard(), this.getSnapshot()]);
    const redactedAccounts = redactAccountsForSummary(snapshot.accounts, request.redactionLevel);
    const recentJournals = [...snapshot.journalEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((entry) => ({
        title: entry.title,
        mood: entry.mood,
        tags: entry.tags,
      }));

    const contextPayload = {
      question: request.question,
      runway: dashboard.runway,
      nextTasks: dashboard.nextTasks.map((task) => ({ title: task.title, status: task.status, dueDate: task.dueDate })),
      topProjects: dashboard.topProjects.map((project) => ({
        name: project.name,
        status: project.status,
        deadline: project.deadline,
      })),
      learningImpact: dashboard.learningOverview.impactScore,
      transitionReadiness: dashboard.transitionOverview.readinessScore,
      familyOverdue: dashboard.familyOverview.overdueRelationships.length,
      accountCoverage: redactedAccounts.length,
      recentJournals,
      redactionLevel: request.redactionLevel,
    };

    const answer = this.env.openAiApiKey
      ? await this.generateOpenAiAssistantAnswer(contextPayload)
      : this.generateDeterministicAssistantAnswer(contextPayload);

    return {
      answer,
      generatedAt: new Date().toISOString(),
      redactionApplied: request.redactionLevel,
    };
  }

  async handleTaskCompletedWebhook(payload: TaskCompletedWebhookRequest): Promise<{ updated: number }> {
    const task = (await this.listTasks()).find((item) => item.id === payload.taskId);
    if (!task) {
      throw new Error(`Task not found: ${payload.taskId}`);
    }

    if (task.status !== "DONE") {
      await this.updateTask(task.id, { status: "DONE" });
    }

    const projects = await this.listProjects();
    const project = projects.find((item) => item.id === task.projectId);
    const targetCourseIds = payload.courseCertIds?.length ? payload.courseCertIds : project?.skillsUsedCourseIds ?? [];

    if (!targetCourseIds.length) {
      return { updated: 0 };
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      let updated = 0;
      snapshot.courses = snapshot.courses.map((course) => {
        if (!targetCourseIds.includes(course.id)) {
          return course;
        }
        updated += 1;
        const appliedProjectIds = Array.from(new Set([...course.appliedProjectIds, task.projectId]));
        const appliedProgressPercent = Math.min(100, course.appliedProgressPercent + 10);
        const status: CourseCert["status"] = appliedProgressPercent >= 100 ? "COMPLETED" : "IN_PROGRESS";
        return {
          ...course,
          appliedProjectIds,
          appliedProgressPercent,
          status,
        };
      });
      return { updated };
    }

    let updated = 0;
    for (const courseId of targetCourseIds) {
      const page = (await (this.notion as any).pages.retrieve({ page_id: courseId })) as any;
      const course = mapNotionPageToCourse(page);
      const appliedProjectIds = Array.from(new Set([...course.appliedProjectIds, task.projectId]));
      const appliedProgressPercent = Math.min(100, course.appliedProgressPercent + 10);
      await (this.notion as any).pages.update({
        page_id: courseId,
        properties: {
          applied_projects: { relation: appliedProjectIds.map((id) => ({ id })) },
          applied_progress_percent: { number: appliedProgressPercent },
          status: { select: { name: appliedProgressPercent >= 100 ? "COMPLETED" : "IN_PROGRESS" } },
        },
      });
      updated += 1;
    }

    return { updated };
  }

  async listHealthLogs(windowDays?: number): Promise<HealthDailyLog[]> {
    if (!this.notion) {
      const logs = [...memoryStore.get().healthLogs].sort((a, b) => b.date.localeCompare(a.date));
      if (!windowDays) {
        return logs;
      }
      const earliestMs = Date.now() - windowDays * DAY_MS;
      return logs.filter((log) => new Date(log.date).getTime() >= earliestMs);
    }

    const dbId = this.requireDatabaseId("healthLogs");
    const response = await this.queryAllPages(dbId);
    const logs = response.map(mapNotionPageToHealthLog).sort((a, b) => b.date.localeCompare(a.date));
    if (!windowDays) {
      return logs;
    }
    const earliestMs = Date.now() - windowDays * DAY_MS;
    return logs.filter((log) => new Date(log.date).getTime() >= earliestMs);
  }

  async listWorkouts(windowDays?: number): Promise<WorkoutSession[]> {
    if (!this.notion) {
      const workouts = [...memoryStore.get().workouts].sort((a, b) => b.date.localeCompare(a.date));
      if (!windowDays) {
        return workouts;
      }
      const earliestMs = Date.now() - windowDays * DAY_MS;
      return workouts.filter((workout) => new Date(workout.date).getTime() >= earliestMs);
    }

    const dbId = this.requireDatabaseId("workouts");
    const response = await this.queryAllPages(dbId);
    const workouts = response.map(mapNotionPageToWorkout).sort((a, b) => b.date.localeCompare(a.date));
    if (!windowDays) {
      return workouts;
    }
    const earliestMs = Date.now() - windowDays * DAY_MS;
    return workouts.filter((workout) => new Date(workout.date).getTime() >= earliestMs);
  }

  async listFamilyEvents(windowDays?: number): Promise<FamilyEvent[]> {
    if (!this.notion) {
      const events = [...memoryStore.get().familyEvents].sort((a, b) => a.date.localeCompare(b.date));
      if (!windowDays) {
        return events;
      }
      const latestMs = Date.now() + windowDays * DAY_MS;
      return events.filter((event) => new Date(event.date).getTime() <= latestMs);
    }

    const dbId = this.requireDatabaseId("familyEvents");
    const response = await this.queryAllPages(dbId);
    const events = response.map(mapNotionPageToFamilyEvent).sort((a, b) => a.date.localeCompare(b.date));
    if (!windowDays) {
      return events;
    }
    const latestMs = Date.now() + windowDays * DAY_MS;
    return events.filter((event) => new Date(event.date).getTime() <= latestMs);
  }

  async listRelationshipCheckins(): Promise<RelationshipCheckin[]> {
    if (!this.notion) {
      return [...memoryStore.get().relationshipCheckins];
    }

    const dbId = this.requireDatabaseId("relationshipCheckins");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToRelationshipCheckin);
  }

  async listTimeOffPlans(): Promise<TimeOffPlan[]> {
    if (!this.notion) {
      return [...memoryStore.get().timeOffPlans];
    }

    const dbId = this.requireDatabaseId("timeOffPlans");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToTimeOffPlan);
  }

  async listJournalEntries(limit?: number): Promise<JournalEntry[]> {
    let entries: JournalEntry[];

    if (!this.notion) {
      entries = [...memoryStore.get().journalEntries].sort((a, b) => b.date.localeCompare(a.date));
    } else {
      const dbId = this.requireDatabaseId("journalEntries");
      const response = await this.queryAllPages(dbId);
      entries = response.map(mapNotionPageToJournalEntry).sort((a, b) => b.date.localeCompare(a.date));
    }

    return typeof limit === "number" ? entries.slice(0, Math.max(0, limit)) : entries;
  }

  async listAccountReferences(redactionLevel: RedactionLevel = "STRICT"): Promise<AccountRef[]> {
    const accounts = await this.listAccounts();
    return redactAccountsForSummary(accounts, redactionLevel);
  }

  async listPathways(): Promise<Pathway[]> {
    if (!this.notion) {
      return memoryStore.get().pathways;
    }

    const dbId = this.requireDatabaseId("pathways");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToPathway);
  }

  async listCourses(): Promise<CourseCert[]> {
    if (!this.notion) {
      return memoryStore.get().courses;
    }

    const dbId = this.requireDatabaseId("coursesCerts");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToCourse);
  }

  private async listTransactions(): Promise<Transaction[]> {
    if (!this.notion) {
      return memoryStore.get().transactions;
    }

    const dbId = this.requireDatabaseId("transactions");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToTransaction);
  }

  private async listMetrics(): Promise<LosDataSnapshot["metrics"]> {
    if (!this.notion) {
      return memoryStore.get().metrics;
    }

    const dbId = this.requireDatabaseId("metrics");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToMetric);
  }

  private async getSnapshot(): Promise<LosDataSnapshot> {
    if (!this.notion) {
      return memoryStore.get();
    }

    const [
      areas,
      entities,
      projects,
      tasks,
      pathways,
      transactions,
      upcomingExpenses,
      metrics,
      courses,
      accounts,
      healthLogs,
      workouts,
      familyEvents,
      relationshipCheckins,
      timeOffPlans,
      journalEntries,
    ] = await Promise.all([
      this.listAreas(false),
      this.listEntities(),
      this.listProjects(),
      this.listTasks(),
      this.listPathways(),
      this.listTransactions(),
      this.listUpcomingExpenses(),
      this.listMetrics(),
      this.listCourses(),
      this.listAccounts(),
      this.listHealthLogs(),
      this.listWorkouts(),
      this.listFamilyEvents(),
      this.listRelationshipCheckins(),
      this.listTimeOffPlans(),
      this.listJournalEntries(),
    ]);

    return {
      areas,
      entities,
      projects,
      tasks,
      pathways,
      courses,
      accounts,
      transactions,
      upcomingExpenses,
      metrics,
      healthLogs,
      workouts,
      familyEvents,
      relationshipCheckins,
      timeOffPlans,
      journalEntries,
      reviews: [],
    };
  }

  async listAccounts(): Promise<LosDataSnapshot["accounts"]> {
    if (!this.notion) {
      return memoryStore.get().accounts;
    }

    const dbId = this.requireDatabaseId("accounts");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToAccount);
  }

  private requireDatabaseId(key: keyof LosEnv["databaseIds"]): string {
    const id = this.env.databaseIds[key];
    if (!id) {
      throw new Error(`Missing Notion database id for '${key}'.`);
    }
    return id;
  }

  private async queryAllPages(databaseId: string, filter?: Record<string, unknown>): Promise<any[]> {
    if (!this.notion) {
      return [];
    }

    const notionAny = this.notion as any;
    const results: any[] = [];
    let cursor: string | undefined;

    while (true) {
      const queryPayload = {
        start_cursor: cursor,
        page_size: 100,
        ...(filter ? { filter } : {}),
      };

      const response =
        notionAny.databases?.query
          ? await notionAny.databases.query({
              database_id: databaseId,
              ...queryPayload,
            })
          : notionAny.dataSources?.query
            ? await notionAny.dataSources.query({
                data_source_id: databaseId,
                ...queryPayload,
              })
            : notionAny.request
              ? await notionAny.request({
                  path: "/v1/data_sources/query",
                  method: "post",
                  body: {
                    data_source_id: databaseId,
                    ...queryPayload,
                  },
                })
              : (() => {
                  throw new Error("Notion client does not expose a supported query method.");
                })();

      for (const result of response.results) {
        if ((result as any).object === "page") {
          results.push(result);
        }
      }

      if (!response.has_more || !response.next_cursor) {
        break;
      }
      cursor = response.next_cursor;
    }

    return results;
  }

  private generateDeterministicSummary(
    payload: {
      reviewDate: string;
      doneCount: number;
      activeCount: number;
      onHoldProjects: string[];
      runway: RunwayResult;
      accountCoverage: number;
    },
    redactionLevel: RedactionLevel,
  ): string {
    const onHold = payload.onHoldProjects.length ? payload.onHoldProjects.join(", ") : "None";
    return [
      `LOS Weekly Summary (${payload.reviewDate})`,
      `- Completed tasks in window: ${payload.doneCount}`,
      `- Active next/doing tasks: ${payload.activeCount}`,
      `- On-hold projects: ${onHold}`,
      `- Runway: ${payload.runway.monthsOfFreedom} months (Liquid ${payload.runway.liquidAssets} AUD / Burn ${payload.runway.monthlyBurn} AUD)`,
      `- Accounts covered in review: ${payload.accountCoverage}`,
      `- Redaction policy: ${redactionLevel}`,
      "Recommended next move: close the highest-impact NEXT task first, then reduce one recurring expense this week.",
    ].join("\n");
  }

  private async generateOpenAiSummary(
    payload: {
      reviewDate: string;
      doneCount: number;
      activeCount: number;
      onHoldProjects: string[];
      runway: RunwayResult;
      accountCoverage: number;
    },
    redactionLevel: RedactionLevel,
  ): Promise<string> {
    if (!this.env.openAiApiKey) {
      return this.generateDeterministicSummary(payload, redactionLevel);
    }

    const input = `You are a read-only executive life operations coach.\nData: ${JSON.stringify(payload)}\nRules: Keep response concise, do not ask for secrets, no data mutation advice.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.env.openAiModel,
        input,
      }),
    });

    if (!response.ok) {
      return this.generateDeterministicSummary(payload, redactionLevel);
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };

    if (typeof data.output_text === "string" && data.output_text.trim()) {
      return data.output_text;
    }

    const fallback = data.output?.flatMap((chunk) => chunk.content ?? []).map((item) => item.text ?? "").join("\n");
    return fallback?.trim() || this.generateDeterministicSummary(payload, redactionLevel);
  }

  private generateDeterministicAssistantAnswer(payload: {
    question: string;
    runway: RunwayResult;
    nextTasks: Array<{ title: string; status: Task["status"]; dueDate?: string }>;
    topProjects: Array<{ name: string; status: Project["status"]; deadline?: string }>;
    learningImpact: number;
    transitionReadiness: number;
    familyOverdue: number;
    accountCoverage: number;
    recentJournals: Array<{ title: string; mood: string; tags: string[] }>;
    redactionLevel: RedactionLevel;
  }): string {
    const overdueTasks = payload.nextTasks.filter(
      (task) => task.status !== "DONE" && task.dueDate && new Date(task.dueDate).getTime() <= Date.now(),
    ).length;
    const onHoldProjects = payload.topProjects.filter((project) => project.status === "ON_HOLD").length;

    const bottleneck =
      overdueTasks > 0
        ? "Overdue next tasks are the current bottleneck."
        : onHoldProjects > 0
          ? "On-hold projects are blocking forward momentum."
          : "Execution flow is healthy; prioritize finishing one DOING task today.";

    return [
      `LOS Assistant (read-only, ${payload.redactionLevel}):`,
      `Question: ${payload.question}`,
      "",
      `Primary insight: ${bottleneck}`,
      `Runway: ${payload.runway.monthsOfFreedom} months (burn ${payload.runway.monthlyBurn} AUD).`,
      `Learning impact: ${payload.learningImpact}% · Transition readiness: ${payload.transitionReadiness}%.`,
      `Family overdue check-ins: ${payload.familyOverdue} · Account records covered: ${payload.accountCoverage}.`,
      `Recent journal signal: ${payload.recentJournals.map((entry) => `${entry.title} (${entry.mood})`).join(", ") || "No recent journal entries."}`,
      "",
      "Next action: close one at-risk task, then lock tomorrow's first deep-work block.",
    ].join("\n");
  }

  private async generateOpenAiAssistantAnswer(payload: {
    question: string;
    runway: RunwayResult;
    nextTasks: Array<{ title: string; status: Task["status"]; dueDate?: string }>;
    topProjects: Array<{ name: string; status: Project["status"]; deadline?: string }>;
    learningImpact: number;
    transitionReadiness: number;
    familyOverdue: number;
    accountCoverage: number;
    recentJournals: Array<{ title: string; mood: string; tags: string[] }>;
    redactionLevel: RedactionLevel;
  }): Promise<string> {
    if (!this.env.openAiApiKey) {
      return this.generateDeterministicAssistantAnswer(payload);
    }

    const input = [
      "You are LOS Assistant: a read-only life operations coach.",
      "Never ask for secrets, never output credentials, never suggest bypassing security rules.",
      "Give concise, actionable analysis with 3 bullets max and one explicit next action.",
      `Data: ${JSON.stringify(payload)}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.env.openAiModel,
        input,
      }),
    });

    if (!response.ok) {
      return this.generateDeterministicAssistantAnswer(payload);
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };

    if (typeof data.output_text === "string" && data.output_text.trim()) {
      return data.output_text;
    }

    const fallback = data.output?.flatMap((chunk) => chunk.content ?? []).map((item) => item.text ?? "").join("\n");
    return fallback?.trim() || this.generateDeterministicAssistantAnswer(payload);
  }
}
