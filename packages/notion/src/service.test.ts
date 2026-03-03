import { describe, expect, it, beforeEach } from "vitest";
import { LosService } from "./service";
import { memoryStore } from "./memory-store";
import { assertProjectIntegrity } from "./validators";
import { redactAccountsForSummary } from "./redaction";

describe("LosService mock mode", () => {
  const service = new LosService({
    dataMode: "mock",
    openAiModel: "gpt-4.1-mini",
    timezone: "Australia/Melbourne",
    locale: "en-AU",
    currency: "AUD",
    databaseIds: {},
  });

  beforeEach(() => {
    service.resetMockData();
  });

  it("prevents task creation without valid project", async () => {
    await expect(
      service.createTask({
        title: "Invalid task",
        projectId: "missing-project",
        energy: "LOW",
        context: "LAPTOP",
        recurring: false,
      }),
    ).rejects.toThrow("Task must belong to an existing project");
  });

  it("hides archived entities from active-only listing", async () => {
    const entities = await service.listEntities();
    const target = entities[0];
    await service.updateEntity(target.id, { status: "ARCHIVED" });

    const activeOnly = await service.listEntities(false);
    expect(activeOnly.find((entity) => entity.id === target.id)).toBeUndefined();
  });

  it("updates learning application progress on task-completed webhook", async () => {
    const before = memoryStore.get().courses.find((course) => course.id === "course_next_arch");
    expect(before?.appliedProgressPercent).toBe(45);

    const result = await service.handleTaskCompletedWebhook({ taskId: "task_1" });
    const after = memoryStore.get().courses.find((course) => course.id === "course_next_arch");

    expect(result.updated).toBeGreaterThan(0);
    expect(after?.appliedProgressPercent).toBe(55);
  });

  it("calculates runway and responds to new expenses", async () => {
    const initial = await service.getRunway();
    memoryStore.get().transactions.push({
      id: "txn_test",
      date: new Date().toISOString(),
      amount: 7_000,
      type: "EXPENSE",
      entityId: "ent_personal",
      category: "Stress test",
    });

    const updated = await service.getRunway();
    expect(updated.monthlyBurn).toBeGreaterThan(initial.monthlyBurn);
    expect(updated.monthsOfFreedom).toBeLessThan(initial.monthsOfFreedom);
  });

  it("builds health overview with weekly aggregates", async () => {
    const overview = await service.getHealthOverview();
    expect(overview.latestLog?.entityId).toBe("ent_fitness");
    expect(overview.workoutsThisWeek).toBeGreaterThan(0);
    expect(overview.trainingMinutesThisWeek).toBeGreaterThan(0);
    expect(overview.weeklyAverages.steps).toBeGreaterThan(0);
  });

  it("health overview updates when new workout is added", async () => {
    const before = await service.getHealthOverview();
    memoryStore.get().workouts.push({
      id: "workout_test",
      date: new Date().toISOString(),
      entityId: "ent_fitness",
      sessionType: "CARDIO",
      intensity: "MEDIUM",
      durationMinutes: 55,
    });
    const after = await service.getHealthOverview();
    expect(after.workoutsThisWeek).toBe(before.workoutsThisWeek + 1);
    expect(after.byType.CARDIO).toBeGreaterThanOrEqual(before.byType.CARDIO + 1);
  });

  it("builds family overview with upcoming events and overdue check-ins", async () => {
    const overview = await service.getFamilyOverview();
    expect(overview.upcomingEvents.length).toBeGreaterThan(0);
    expect(overview.overdueRelationships.length).toBeGreaterThan(0);
  });

  it("family overview due-soon grows when cadence is near limit", async () => {
    memoryStore.get().relationshipCheckins.push({
      id: "checkin_test",
      person: "Test Friend",
      relationType: "FRIEND",
      lastMeaningfulContact: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      targetCadenceDays: 14,
      entityId: "ent_family",
    });
    const overview = await service.getFamilyOverview();
    expect(overview.dueSoonRelationships.some((item) => item.person === "Test Friend")).toBe(true);
  });

  it("builds transition overview with readiness and plans", async () => {
    const overview = await service.getTransitionOverview();
    expect(overview.preSabbaticalPlans.length).toBeGreaterThan(0);
    expect(overview.runwayMonths).toBeGreaterThan(0);
    expect(overview.readinessScore).toBeGreaterThanOrEqual(0);
  });

  it("transition at-risk plans include near-deadline non-ready items", async () => {
    memoryStore.get().timeOffPlans.push({
      id: "timeoff_risk_test",
      title: "Urgent transition test",
      status: "PRE_SABBATICAL",
      targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCostAud: 500,
      priority: "HIGH",
    });

    const overview = await service.getTransitionOverview();
    expect(overview.atRiskPlans.some((plan) => plan.id === "timeoff_risk_test")).toBe(true);
  });

  it("builds learning overview with active pathways and impact score", async () => {
    const overview = await service.getLearningOverview();
    expect(overview.activePathways.length).toBeGreaterThan(0);
    expect(overview.upcomingCourseDeadlines.length).toBeGreaterThan(0);
    expect(overview.impactScore).toBeGreaterThan(0);
  });

  it("learning overview flags near-term deadlines as at risk", async () => {
    memoryStore.get().courses.push({
      id: "course_deadline_risk",
      title: "Urgent cert",
      pathwayId: "path_fullstack",
      status: "IN_PROGRESS",
      targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 40,
      completedHours: 8,
      proofUrls: [],
      appliedProjectIds: ["proj_los_v1"],
      appliedProgressPercent: 20,
    });

    const overview = await service.getLearningOverview();
    expect(overview.upcomingCourseDeadlines.some((course) => course.id === "course_deadline_risk" && course.atRisk)).toBe(
      true,
    );
  });

  it("returns account references with strict redaction by default", async () => {
    const accounts = await service.listAccountReferences();
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0]?.vaultItemUrl).toBe("[REDACTED]");
    expect(accounts[0]?.loginIdentifier).toContain("***@");
  });

  it("returns account references with standard redaction when requested", async () => {
    const accounts = await service.listAccountReferences("STANDARD");
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0]?.vaultItemUrl).toBe("[REDACTED]");
    expect(accounts[0]?.loginIdentifier.includes("***@")).toBe(false);
  });

  it("lists journal entries newest first", async () => {
    const entries = await service.listJournalEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(new Date(entries[0]!.date).getTime()).toBeGreaterThanOrEqual(new Date(entries[1]!.date).getTime());
  });

  it("creates a journal entry and returns it at the top", async () => {
    const created = await service.createJournalEntry({
      title: "New journal test",
      entry: "Captured from test flow.",
      mood: "GOOD",
      tags: ["test", "journal"],
      energyScore: 7,
      focusScore: 8,
    });

    expect(created.id).toContain("journal_");
    const entries = await service.listJournalEntries(1);
    expect(entries[0]?.title).toBe("New journal test");
  });

  it("returns read-only assistant answer with strict redaction", async () => {
    const response = await service.queryAssistant({
      question: "What is my biggest bottleneck this week?",
      redactionLevel: "STRICT",
    });
    expect(response.redactionApplied).toBe("STRICT");
    expect(response.answer.length).toBeGreaterThan(0);
  });

  it("returns startup readiness in mock mode", async () => {
    const readiness = await service.getSystemReadiness();
    expect(readiness.dataMode).toBe("mock");
    expect(readiness.startupReady).toBe(true);
    expect(readiness.dataCounts.projects).toBeGreaterThan(0);
  });
});

describe("integrity + redaction", () => {
  it("requires post-mortem for ceased projects", () => {
    expect(() =>
      assertProjectIntegrity({
        id: "p1",
        name: "Stopped project",
        entityId: "ent_los",
        status: "CEASED",
        skillsUsedCourseIds: [],
      }),
    ).toThrow("Ceased projects require a post-mortem");
  });

  it("strict redaction removes vaults and masks identifiers", () => {
    const [redacted] = redactAccountsForSummary(
      [
        {
          id: "acc_1",
          service: "Google",
          entityId: "ent_los",
          loginIdentifier: "admin@example.com",
          role: "OWNER",
          twoFactorEnabled: true,
          vaultItemUrl: "https://start.1password.com/item",
          vaultItemId: "vault123",
        },
      ],
      "STRICT",
    );

    expect(redacted.vaultItemUrl).toBe("[REDACTED]");
    expect(redacted.vaultItemId).toBe("[REDACTED]");
    expect(redacted.loginIdentifier).toContain("***@");
  });
});
