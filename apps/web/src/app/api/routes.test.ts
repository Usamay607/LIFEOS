import { describe, expect, it } from "vitest";
import { GET as getDashboardHome } from "./dashboard/home/route";
import { GET as getHealthOverview } from "./health/overview/route";
import { GET as getFamilyOverview } from "./family/overview/route";
import { GET as getTransitionOverview } from "./transition/overview/route";
import { GET as getLearningOverview } from "./learning/overview/route";
import { GET as getAccounts } from "./accounts/route";
import { GET as getJournal, POST as createJournal } from "./journal/route";
import { POST as assistantQuery } from "./assistant/query/route";
import { GET as getSystemReadiness } from "./system/readiness/route";
import { GET as getProjects } from "./projects/route";
import { POST as createProject } from "./projects/route";
import { PATCH as patchProject } from "./projects/[id]/route";
import { GET as getEntities, POST as createEntity } from "./entities/route";
import { PATCH as patchEntity } from "./entities/[id]/route";
import { POST as createTask } from "./tasks/route";
import { PATCH as patchTask } from "./tasks/[id]/route";
import { GET as getFocusState, PUT as putFocusState } from "./focus/state/route";
import { POST as weeklySummary } from "./reviews/weekly-summary/route";
import { POST as taskCompletedHook } from "./hooks/task-completed/route";
import { GET as getMetrics, POST as createMetric } from "./metrics/route";
import { PATCH as patchMetric } from "./metrics/[id]/route";
import { GET as getHealthLogs, POST as createHealthLog } from "./health/logs/route";
import { PATCH as patchHealthLog } from "./health/logs/[id]/route";
import { GET as getWorkouts, POST as createWorkout } from "./health/workouts/route";
import { PATCH as patchWorkout } from "./health/workouts/[id]/route";
import { GET as getFamilyEvents, POST as createFamilyEvent } from "./family/events/route";
import { PATCH as patchFamilyEvent } from "./family/events/[id]/route";
import { GET as getRelationshipCheckins, POST as createRelationshipCheckin } from "./family/checkins/route";
import { PATCH as patchRelationshipCheckin } from "./family/checkins/[id]/route";
import { GET as getTimeOffPlans, POST as createTimeOffPlan } from "./transition/plans/route";
import { PATCH as patchTimeOffPlan } from "./transition/plans/[id]/route";
import { GET as getReviews, POST as createReview } from "./reviews/route";
import { POST as weeklyDraft } from "./reviews/weekly-draft/route";
import { GET as getExpenseReminders } from "./upcoming-expenses/reminders/route";

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("web API routes", () => {
  it("returns home payload with health overview", async () => {
    const response = await getDashboardHome();
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      topProjects: unknown[];
      nextTasks: unknown[];
      healthOverview: { workoutsThisWeek: number };
      familyOverview: { upcomingEvents: unknown[] };
      transitionOverview: { preSabbaticalPlans: unknown[] };
      learningOverview: { impactScore: number };
    };

    expect(data.topProjects.length).toBeGreaterThan(0);
    expect(data.nextTasks.length).toBeGreaterThan(0);
    expect(data.healthOverview.workoutsThisWeek).toBeGreaterThan(0);
    expect(data.familyOverview.upcomingEvents.length).toBeGreaterThan(0);
    expect(data.transitionOverview.preSabbaticalPlans.length).toBeGreaterThan(0);
    expect(data.learningOverview.impactScore).toBeGreaterThanOrEqual(0);
  });

  it("returns health overview endpoint payload", async () => {
    const response = await getHealthOverview();
    expect(response.status).toBe(200);
    const data = (await response.json()) as { weeklyAverages: { steps: number }; byType: Record<string, number> };

    expect(data.weeklyAverages.steps).toBeGreaterThan(0);
    expect(data.byType.STRENGTH).toBeGreaterThanOrEqual(0);
  });

  it("returns family overview endpoint payload", async () => {
    const response = await getFamilyOverview();
    expect(response.status).toBe(200);
    const data = (await response.json()) as { upcomingEvents: unknown[]; overdueRelationships: unknown[] };

    expect(data.upcomingEvents.length).toBeGreaterThan(0);
    expect(data.overdueRelationships.length).toBeGreaterThanOrEqual(0);
  });

  it("returns transition overview endpoint payload", async () => {
    const response = await getTransitionOverview();
    expect(response.status).toBe(200);
    const data = (await response.json()) as { readinessScore: number; preSabbaticalPlans: unknown[] };

    expect(data.readinessScore).toBeGreaterThanOrEqual(0);
    expect(data.preSabbaticalPlans.length).toBeGreaterThan(0);
  });

  it("returns learning overview endpoint payload", async () => {
    const response = await getLearningOverview();
    expect(response.status).toBe(200);
    const data = (await response.json()) as { impactScore: number; activePathways: unknown[] };

    expect(data.impactScore).toBeGreaterThanOrEqual(0);
    expect(data.activePathways.length).toBeGreaterThan(0);
  });

  it("returns redacted account references", async () => {
    const strictResponse = await getAccounts(new Request("http://localhost/api/accounts"));
    expect(strictResponse.status).toBe(200);
    const strictData = (await strictResponse.json()) as { redactionLevel: string; accounts: Array<{ loginIdentifier: string; vaultItemUrl: string }> };
    expect(strictData.redactionLevel).toBe("STRICT");
    expect(strictData.accounts.length).toBeGreaterThan(0);
    expect(strictData.accounts[0]?.loginIdentifier).toContain("***@");
    expect(strictData.accounts[0]?.vaultItemUrl).toBe("[REDACTED]");

    const standardResponse = await getAccounts(new Request("http://localhost/api/accounts?redactionLevel=STANDARD"));
    expect(standardResponse.status).toBe(200);
    const standardData = (await standardResponse.json()) as { redactionLevel: string; accounts: Array<{ vaultItemUrl: string }> };
    expect(standardData.redactionLevel).toBe("STANDARD");
    expect(standardData.accounts[0]?.vaultItemUrl).toBe("[REDACTED]");
  });

  it("returns and creates journal entries", async () => {
    const listResponse = await getJournal(new Request("http://localhost/api/journal?limit=2"));
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as Array<{ title: string }>;
    expect(list.length).toBeGreaterThan(0);

    const createResponse = await createJournal(
      jsonRequest("http://localhost/api/journal", {
        title: "Journal API test",
        entry: "Captured from routes test.",
        mood: "GOOD",
        tags: ["test"],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { title: string; mood: string };
    expect(created.title).toBe("Journal API test");
    expect(created.mood).toBe("GOOD");
  });

  it("returns assistant analysis for a read-only question", async () => {
    const response = await assistantQuery(
      jsonRequest("http://localhost/api/assistant/query", {
        question: "What should I prioritize first tomorrow morning?",
        redactionLevel: "STRICT",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { answer: string; redactionApplied: string };
    expect(payload.redactionApplied).toBe("STRICT");
    expect(payload.answer.length).toBeGreaterThan(0);
  });

  it("returns startup readiness payload", async () => {
    const response = await getSystemReadiness();
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      dataMode: string;
      startupReady: boolean;
      configuredDatabases: number;
      requiredDatabasesTotal: number;
      dashboardPinConfigured: boolean;
    };

    expect(["mock", "notion"]).toContain(payload.dataMode);
    expect(typeof payload.startupReady).toBe("boolean");
    expect(payload.configuredDatabases).toBeLessThanOrEqual(payload.requiredDatabasesTotal);
    expect(typeof payload.dashboardPinConfigured).toBe("boolean");
  });

  it("returns projects with status filter", async () => {
    const response = await getProjects(new Request("http://localhost/api/projects?status=ACTIVE"));
    expect(response.status).toBe(200);
    const projects = (await response.json()) as Array<{ status: string }>;
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((project) => project.status === "ACTIVE")).toBe(true);
  });

  it("creates and updates a project", async () => {
    const createdResponse = await createProject(
      jsonRequest("http://localhost/api/projects", {
        name: "Data studio project",
        entityId: "ent_los",
        status: "ACTIVE",
      }),
    );
    expect(createdResponse.status).toBe(201);
    const created = (await createdResponse.json()) as { id: string; name: string };
    expect(created.name).toBe("Data studio project");

    const patchedResponse = await patchProject(
      jsonRequest("http://localhost/api/projects/id", { status: "ON_HOLD" }, "PATCH"),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(patchedResponse.status).toBe(200);
    const patched = (await patchedResponse.json()) as { status: string };
    expect(patched.status).toBe("ON_HOLD");
  });

  it("upserts and retrieves focus state", async () => {
    const putResponse = await putFocusState(
      jsonRequest(
        "http://localhost/api/focus/state",
        {
          date: new Date().toISOString(),
          outcomes: ["Outcome A", "Outcome B", "Outcome C"],
          completed: [true, false, false],
          nextAction: "Ship one focused task.",
          blocker: "None",
        },
        "PUT",
      ),
    );
    expect(putResponse.status).toBe(200);
    const putPayload = (await putResponse.json()) as { outcomes: string[]; completed: boolean[] };
    expect(putPayload.outcomes).toHaveLength(3);
    expect(putPayload.completed).toHaveLength(3);

    const getResponse = await getFocusState(new Request("http://localhost/api/focus/state"));
    expect(getResponse.status).toBe(200);
    const getPayload = (await getResponse.json()) as { outcomes?: string[] } | null;
    expect(getPayload).toBeTruthy();
    expect(getPayload?.outcomes?.length).toBe(3);
  });

  it("rejects invalid project status filter", async () => {
    const response = await getProjects(new Request("http://localhost/api/projects?status=INVALID"));
    expect(response.status).toBe(400);
  });

  it("updates task status via patch route", async () => {
    const createResponse = await createTask(
      jsonRequest("http://localhost/api/tasks", {
        title: "Task patch flow",
        projectId: "proj_los_v1",
        energy: "LOW",
        context: "PHONE",
        recurring: false,
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; status: string };
    expect(created.status).toBe("NEXT");

    const patchResponse = await patchTask(
      jsonRequest("http://localhost/api/tasks/id", { status: "DONE" }, "PATCH"),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(patchResponse.status).toBe(200);
    const patched = (await patchResponse.json()) as { status: string };
    expect(patched.status).toBe("DONE");
  });

  it("rejects invalid task creation and accepts valid payload", async () => {
    const bad = await createTask(jsonRequest("http://localhost/api/tasks", { title: "", projectId: "" }));
    expect(bad.status).toBe(400);

    const good = await createTask(
      jsonRequest("http://localhost/api/tasks", {
        title: "API test task",
        projectId: "proj_los_v1",
        energy: "MEDIUM",
        context: "LAPTOP",
        recurring: false,
      }),
    );

    expect(good.status).toBe(201);
    const task = (await good.json()) as { title: string; projectId: string };
    expect(task.title).toBe("API test task");
    expect(task.projectId).toBe("proj_los_v1");
  });

  it("creates and updates an entity", async () => {
    const createdResponse = await createEntity(
      jsonRequest("http://localhost/api/entities", {
        name: "New Test Entity",
        areaId: "area_health",
        type: "PROJECT",
      }),
    );

    expect(createdResponse.status).toBe(201);
    const created = (await createdResponse.json()) as { id: string; name: string };

    const patchedResponse = await patchEntity(
      jsonRequest("http://localhost/api/entities/id", { name: "Renamed Test Entity" }, "PATCH"),
      { params: Promise.resolve({ id: created.id }) },
    );

    expect(patchedResponse.status).toBe(200);
    const patched = (await patchedResponse.json()) as { name: string };
    expect(patched.name).toBe("Renamed Test Entity");

    const allEntitiesResponse = await getEntities(new Request("http://localhost/api/entities?includeArchived=true"));
    const allEntities = (await allEntitiesResponse.json()) as Array<{ id: string }>;
    expect(allEntities.some((entity) => entity.id === created.id)).toBe(true);
  });

  it("creates and updates a metric", async () => {
    const createResponse = await createMetric(
      jsonRequest("http://localhost/api/metrics", {
        metricName: "Test Metric",
        category: "FINANCE",
        value: 1234,
        unit: "AUD",
        date: new Date().toISOString(),
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; value: number };
    expect(created.value).toBe(1234);

    const patchResponse = await patchMetric(
      jsonRequest("http://localhost/api/metrics/id", { value: 1500 }, "PATCH"),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(patchResponse.status).toBe(200);
    const patched = (await patchResponse.json()) as { value: number };
    expect(patched.value).toBe(1500);

    const listResponse = await getMetrics();
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as Array<{ id: string }>;
    expect(list.some((item) => item.id === created.id)).toBe(true);
  });

  it("creates and updates a health daily log", async () => {
    const createResponse = await createHealthLog(
      jsonRequest("http://localhost/api/health/logs", {
        date: new Date().toISOString(),
        entityId: "ent_fitness",
        steps: 9000,
        sleepHours: 7.2,
        restingHeartRate: 58,
        hydrationLiters: 2.8,
        recoveryScore: 74,
        weightKg: 81.7,
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; steps: number };
    expect(created.steps).toBe(9000);

    const patchResponse = await patchHealthLog(
      jsonRequest("http://localhost/api/health/logs/id", { steps: 10100 }, "PATCH"),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(patchResponse.status).toBe(200);
    const patched = (await patchResponse.json()) as { steps: number };
    expect(patched.steps).toBe(10100);

    const listResponse = await getHealthLogs();
    expect(listResponse.status).toBe(200);
  });

  it("creates and updates a workout", async () => {
    const createResponse = await createWorkout(
      jsonRequest("http://localhost/api/health/workouts", {
        date: new Date().toISOString(),
        entityId: "ent_fitness",
        sessionType: "STRENGTH",
        intensity: "MEDIUM",
        durationMinutes: 45,
        volumeLoadKg: 5400,
        notes: "Leg day",
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; durationMinutes: number };
    expect(created.durationMinutes).toBe(45);

    const patchResponse = await patchWorkout(
      jsonRequest("http://localhost/api/health/workouts/id", { durationMinutes: 50 }, "PATCH"),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(patchResponse.status).toBe(200);
    const patched = (await patchResponse.json()) as { durationMinutes: number };
    expect(patched.durationMinutes).toBe(50);

    const listResponse = await getWorkouts();
    expect(listResponse.status).toBe(200);
  });

  it("creates and updates family and transition records", async () => {
    const createEventResponse = await createFamilyEvent(
      jsonRequest("http://localhost/api/family/events", {
        title: "Family Dinner",
        date: new Date().toISOString(),
        category: "FAMILY",
        importance: "HIGH",
        entityId: "ent_family",
        notes: "Friday night",
      }),
    );
    expect(createEventResponse.status).toBe(201);
    const createdEvent = (await createEventResponse.json()) as { id: string; title: string };
    expect(createdEvent.title).toBe("Family Dinner");

    const patchEventResponse = await patchFamilyEvent(
      jsonRequest("http://localhost/api/family/events/id", { title: "Family Dinner Updated" }, "PATCH"),
      { params: Promise.resolve({ id: createdEvent.id }) },
    );
    expect(patchEventResponse.status).toBe(200);

    const createCheckinResponse = await createRelationshipCheckin(
      jsonRequest("http://localhost/api/family/checkins", {
        person: "Mum",
        relationType: "FAMILY",
        lastMeaningfulContact: new Date().toISOString(),
        targetCadenceDays: 7,
        entityId: "ent_family",
      }),
    );
    expect(createCheckinResponse.status).toBe(201);
    const createdCheckin = (await createCheckinResponse.json()) as { id: string; targetCadenceDays: number };
    expect(createdCheckin.targetCadenceDays).toBe(7);

    const patchCheckinResponse = await patchRelationshipCheckin(
      jsonRequest("http://localhost/api/family/checkins/id", { targetCadenceDays: 5 }, "PATCH"),
      { params: Promise.resolve({ id: createdCheckin.id }) },
    );
    expect(patchCheckinResponse.status).toBe(200);

    const createPlanResponse = await createTimeOffPlan(
      jsonRequest("http://localhost/api/transition/plans", {
        title: "3-week reset",
        status: "PRE_SABBATICAL",
        priority: "MEDIUM",
        estimatedCostAud: 4000,
        entityId: "ent_timeoff",
      }),
    );
    expect(createPlanResponse.status).toBe(201);
    const createdPlan = (await createPlanResponse.json()) as { id: string; estimatedCostAud: number };
    expect(createdPlan.estimatedCostAud).toBe(4000);

    const patchPlanResponse = await patchTimeOffPlan(
      jsonRequest("http://localhost/api/transition/plans/id", { estimatedCostAud: 4500 }, "PATCH"),
      { params: Promise.resolve({ id: createdPlan.id }) },
    );
    expect(patchPlanResponse.status).toBe(200);

    expect((await getFamilyEvents()).status).toBe(200);
    expect((await getRelationshipCheckins()).status).toBe(200);
    expect((await getTimeOffPlans()).status).toBe(200);
  });

  it("generates weekly draft, saves review note, and lists reviews", async () => {
    const draftResponse = await weeklyDraft(
      jsonRequest("http://localhost/api/reviews/weekly-draft", {
        reviewDate: new Date().toISOString(),
        taskWindowDays: 7,
      }),
    );
    expect(draftResponse.status).toBe(200);
    const draft = (await draftResponse.json()) as {
      wins: string[];
      stuck: string[];
      topThreeNextWeek: string[];
      runwayCommentary: string;
    };
    expect(draft.topThreeNextWeek.length).toBe(3);
    expect(draft.runwayCommentary.length).toBeGreaterThan(0);

    const createResponse = await createReview(
      jsonRequest("http://localhost/api/reviews", {
        reviewDate: new Date().toISOString(),
        wins: draft.wins,
        stuck: draft.stuck,
        topThreeNextWeek: draft.topThreeNextWeek,
        runwayCommentary: draft.runwayCommentary,
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; topThreeNextWeek: string[] };
    expect(created.id).toContain("review_");
    expect(created.topThreeNextWeek.length).toBeGreaterThan(0);

    const listResponse = await getReviews(new Request("http://localhost/api/reviews?limit=5"));
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as Array<{ id: string }>;
    expect(list.some((item) => item.id === created.id)).toBe(true);
  });

  it("returns upcoming expense reminders payload", async () => {
    const response = await getExpenseReminders(new Request("http://localhost/api/upcoming-expenses/reminders?days=14"));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      overdueCount: number;
      dueSoonCount: number;
      reminders: Array<{ severity: string }>;
    };
    expect(payload.overdueCount).toBeGreaterThanOrEqual(0);
    expect(payload.dueSoonCount).toBeGreaterThanOrEqual(0);
    expect(payload.reminders.length).toBeGreaterThan(0);
  });

  it("generates strict weekly summary", async () => {
    const response = await weeklySummary(
      jsonRequest("http://localhost/api/reviews/weekly-summary", {
        reviewDate: new Date().toISOString(),
        taskWindowDays: 7,
        redactionLevel: "STRICT",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { summary: string; redactionApplied: string };
    expect(payload.redactionApplied).toBe("STRICT");
    expect(payload.summary).toContain("LOS Weekly Summary");
  });

  it("rejects invalid weekly summary payload", async () => {
    const response = await weeklySummary(
      jsonRequest("http://localhost/api/reviews/weekly-summary", {
        reviewDate: new Date().toISOString(),
        taskWindowDays: 0,
        redactionLevel: "STRICT",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("processes task-completed hook", async () => {
    const response = await taskCompletedHook(jsonRequest("http://localhost/api/hooks/task-completed", { taskId: "task_1" }));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { updated: number };
    expect(payload.updated).toBeGreaterThan(0);
  });
});
