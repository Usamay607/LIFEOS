import { Client } from "@notionhq/client";
import type {
  AccountRef,
  AssistantQueryRequest,
  AssistantQueryResponse,
  CourseCert,
  CreateAccountInput,
  CreateCourseCertInput,
  CreateEntityInput,
  CreateFamilyEventInput,
  CreateHealthLogInput,
  FocusState,
  CreateJournalEntryInput,
  CreateMetricInput,
  CreateRelationshipCheckinInput,
  CreatePathwayInput,
  CreateProjectInput,
  CreateReviewNoteInput,
  CreateTaskInput,
  CreateTimeOffPlanInput,
  CreateTransactionInput,
  CreateUpcomingExpenseInput,
  CreateWorkoutInput,
  Entity,
  FamilyEvent,
  FinancePulse,
  FamilyOverview,
  HealthDailyLog,
  HealthOverview,
  HomeDashboardData,
  JournalEntry,
  LearningOverview,
  LosDataSnapshot,
  MetricPoint,
  Pathway,
  Project,
  ReviewNote,
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
  UpdateAccountInput,
  UpdateCourseCertInput,
  UpdateEntityInput,
  UpdateFamilyEventInput,
  UpdateHealthLogInput,
  UpdateMetricInput,
  UpdatePathwayInput,
  UpdateProjectInput,
  UpdateRelationshipCheckinInput,
  UpdateTaskInput,
  UpdateTimeOffPlanInput,
  UpdateTransactionInput,
  UpdateUpcomingExpenseInput,
  UpdateWorkoutInput,
  UpcomingExpenseReminderResponse,
  WeeklyReviewDraftRequest,
  WeeklyReviewDraftResponse,
  WeeklySummaryRequest,
  WeeklySummaryResponse,
  WorkoutSession,
  RelationshipCheckin,
} from "@los/types";
import { deriveFinanceMetricSnapshot } from "@los/types";
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
  mapNotionPageToReview,
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

function daysUntilDate(date: string): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - startOfToday.getTime()) / DAY_MS);
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
      allTransactions,
      allUpcomingExpenses,
      healthOverview,
      familyOverview,
      transitionOverview,
      learningOverview,
    ] = await Promise.all([
      this.listProjects("ACTIVE"),
      this.listTasks(),
      this.getRunway(),
      this.listTransactions(),
      this.listUpcomingExpenses(true),
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

    const pendingTransactions = allTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    const upcomingExpenses = allUpcomingExpenses
      .filter((expense) => !expense.paid)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    return {
      generatedAt: new Date().toISOString(),
      topProjects,
      nextTasks,
      runway,
      financePulse: this.buildFinancePulse(allTransactions, allUpcomingExpenses, runway),
      healthOverview,
      familyOverview,
      transitionOverview,
      learningOverview,
      upcomingExpenses,
      pendingTransactions,
    };
  }

  private buildFinancePulse(
    transactions: Transaction[],
    upcomingExpenses: UpcomingExpense[],
    runway: RunwayResult,
  ): FinancePulse {
    const windowStart = Date.now() - 30 * DAY_MS;

    const last30Transactions = transactions.filter((transaction) => new Date(transaction.date).getTime() >= windowStart);
    const last30Income = round2(
      sum(last30Transactions.filter((transaction) => transaction.type === "INCOME").map((transaction) => transaction.amount)),
    );
    const last30Expenses = round2(
      sum(last30Transactions.filter((transaction) => transaction.type === "EXPENSE").map((transaction) => transaction.amount)),
    );
    const last30NetCashflow = round2(last30Income - last30Expenses);

    const dueSoon = upcomingExpenses.filter((expense) => !expense.paid && daysUntilDate(expense.dueDate) <= 14);

    return {
      last30Income,
      last30Expenses,
      last30NetCashflow,
      savingsRatePercent: last30Income > 0 ? round2(Math.max(0, (last30NetCashflow / last30Income) * 100)) : 0,
      dueSoonTotal: round2(sum(dueSoon.map((expense) => expense.amount))),
      dueSoonCount: dueSoon.length,
      liabilityRatioPercent:
        runway.totalAssets > 0 ? round2((runway.totalLiabilities / runway.totalAssets) * 100) : 0,
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

  async createProject(input: CreateProjectInput): Promise<Project> {
    if (!input.name?.trim()) {
      throw new Error("Project name is required.");
    }
    if (!input.entityId) {
      throw new Error("Project entityId is required.");
    }

    const project: Project = {
      id: `proj_${crypto.randomUUID()}`,
      name: input.name.trim(),
      entityId: input.entityId,
      status: input.status ?? "ACTIVE",
      nextMilestone: input.nextMilestone?.trim() || undefined,
      deadline: toIso(input.deadline),
      skillsUsedCourseIds: input.skillsUsedCourseIds ?? [],
      postMortem: input.postMortem?.trim() || undefined,
    };
    assertProjectIntegrity(project);

    if (!this.notion) {
      const snapshot = memoryStore.get();
      snapshot.projects.unshift(project);
      return project;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("projects") },
      properties: {
        name: titleProperty(project.name),
        entity: { relation: [{ id: project.entityId }] },
        status: { select: { name: project.status } },
        next_milestone: textProperty(project.nextMilestone ?? ""),
        deadline: project.deadline ? { date: { start: project.deadline } } : { date: null },
        skills_used: { relation: project.skillsUsedCourseIds.map((id) => ({ id })) },
        post_mortem: textProperty(project.postMortem ?? ""),
      },
    })) as any;

    return mapNotionPageToProject(page);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.projects.findIndex((project) => project.id === id);
      if (index < 0) {
        throw new Error(`Project not found: ${id}`);
      }
      const existing = snapshot.projects[index];
      if (!existing) {
        throw new Error(`Project not found: ${id}`);
      }

      const updated: Project = {
        ...existing,
        ...input,
        name: input.name?.trim() ? input.name.trim() : existing.name,
        nextMilestone: input.nextMilestone !== undefined ? input.nextMilestone.trim() || undefined : existing.nextMilestone,
        deadline: input.deadline !== undefined ? toIso(input.deadline) : existing.deadline,
        postMortem: input.postMortem !== undefined ? input.postMortem.trim() || undefined : existing.postMortem,
        skillsUsedCourseIds: input.skillsUsedCourseIds ?? existing.skillsUsedCourseIds,
      };
      assertProjectIntegrity(updated);
      snapshot.projects[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.name !== undefined) {
      properties.name = titleProperty(input.name.trim() || "Untitled Project");
    }
    if (input.entityId !== undefined) {
      properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    }
    if (input.status !== undefined) {
      properties.status = { select: { name: input.status } };
    }
    if (input.nextMilestone !== undefined) {
      properties.next_milestone = textProperty(input.nextMilestone.trim());
    }
    if (input.deadline !== undefined) {
      properties.deadline = input.deadline ? { date: { start: input.deadline } } : { date: null };
    }
    if (input.skillsUsedCourseIds !== undefined) {
      properties.skills_used = { relation: input.skillsUsedCourseIds.map((courseId) => ({ id: courseId })) };
    }
    if (input.postMortem !== undefined) {
      properties.post_mortem = textProperty(input.postMortem.trim());
    }

    const page = (await (this.notion as any).pages.update({
      page_id: id,
      properties,
    })) as any;

    const updated = mapNotionPageToProject(page);
    assertProjectIntegrity(updated);
    return updated;
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
        title: input.title.trim(),
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
        title: titleProperty(input.title.trim()),
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
        title: input.title !== undefined ? input.title.trim() : existing.title,
        projectId: input.projectId ?? existing.projectId,
        dueDate: input.dueDate !== undefined ? (input.dueDate ? toIso(input.dueDate) : undefined) : existing.dueDate,
      };
      snapshot.tasks[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.title !== undefined) properties.title = titleProperty(input.title.trim() || "Untitled Task");
    if (input.projectId !== undefined) properties.project = { relation: input.projectId ? [{ id: input.projectId }] : [] };
    if (input.status) properties.status = { select: { name: input.status } };
    if (input.dueDate !== undefined) properties.due_date = input.dueDate ? { date: { start: input.dueDate } } : { date: null };
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

  async listUpcomingExpenses(includePaid = false): Promise<UpcomingExpense[]> {
    if (!this.notion) {
      const rows = memoryStore
        .get()
        .upcomingExpenses.filter((expense) => (includePaid ? true : !expense.paid))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return includePaid ? rows : rows.slice(0, 5);
    }

    const dbId = this.requireDatabaseId("upcomingExpenses");
    const response = await this.queryAllPages(
      dbId,
      includePaid
        ? undefined
        : {
            property: "paid",
            checkbox: { equals: false },
          },
    );

    const rows = response
      .map(mapNotionPageToUpcomingExpense)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return includePaid ? rows : rows.slice(0, 5);
  }

  async getUpcomingExpenseReminders(windowDays = 14): Promise<UpcomingExpenseReminderResponse> {
    const normalizedWindow = Math.max(1, Math.min(60, Math.round(windowDays)));
    const expenses = await this.listUpcomingExpenses(false);

    const reminders = expenses
      .map((expense) => {
        const daysUntilDue = daysUntilDate(expense.dueDate);
        const severity: UpcomingExpenseReminderResponse["reminders"][number]["severity"] =
          daysUntilDue < 0 ? "OVERDUE" : daysUntilDue <= 3 ? "DUE_SOON" : "UPCOMING";

        return {
          expenseId: expense.id,
          bill: expense.bill,
          amount: expense.amount,
          dueDate: expense.dueDate,
          daysUntilDue,
          severity,
        };
      })
      .filter((item) => item.daysUntilDue <= normalizedWindow)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue || b.amount - a.amount)
      .slice(0, 20);

    return {
      generatedAt: new Date().toISOString(),
      windowDays: normalizedWindow,
      overdueCount: reminders.filter((item) => item.severity === "OVERDUE").length,
      dueSoonCount: reminders.filter((item) => item.severity === "DUE_SOON").length,
      reminders,
    };
  }

  async generateWeeklyReviewDraft(request: WeeklyReviewDraftRequest): Promise<WeeklyReviewDraftResponse> {
    const validWindow =
      Number.isFinite(request.taskWindowDays) && Math.round(request.taskWindowDays) > 0 && Math.round(request.taskWindowDays) <= 90;
    if (!request.reviewDate || !validWindow) {
      throw new Error("reviewDate and taskWindowDays(1-90) are required.");
    }

    const normalizedWindow = Math.round(request.taskWindowDays);
    const [tasks, projects, runway, reminders] = await Promise.all([
      this.listTasks(),
      this.listProjects(),
      this.getRunway(),
      this.getUpcomingExpenseReminders(14),
    ]);

    const windowStart = Date.now() - normalizedWindow * DAY_MS;
    const completedInWindow = tasks
      .filter((task) => task.status === "DONE" && new Date(task.createdAt).getTime() >= windowStart)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    const waitingTasks = tasks.filter((task) => task.status === "WAITING");
    const activeQueue = tasks
      .filter((task) => task.status === "NEXT" || task.status === "DOING")
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
    const onHoldProjects = projects.filter((project) => project.status === "ON_HOLD");

    const wins =
      completedInWindow.slice(0, 3).map((task) => `Completed: ${task.title}`) ||
      [];
    if (wins.length === 0) {
      wins.push("Maintained consistent LOS usage and visibility during the week.");
    }

    const stuck = [
      ...waitingTasks.slice(0, 2).map((task) => `Waiting task: ${task.title}`),
      ...onHoldProjects.slice(0, 2).map((project) => `On-hold project: ${project.name}`),
      ...reminders.reminders
        .filter((item) => item.severity !== "UPCOMING")
        .slice(0, 2)
        .map(
          (item) =>
            `${item.severity === "OVERDUE" ? "Overdue expense" : "Due soon expense"}: ${item.bill} (${item.amount.toLocaleString("en-AU")} AUD)`,
        ),
    ]
      .slice(0, 5)
      .filter(Boolean);

    const topThreeNextWeek = activeQueue.slice(0, 3).map((task) => task.title);
    if (topThreeNextWeek.length < 3) {
      const milestoneBackfill = projects
        .filter((project) => project.status === "ACTIVE" && project.nextMilestone)
        .map((project) => `Project milestone: ${project.nextMilestone}`);
      for (const milestone of milestoneBackfill) {
        if (topThreeNextWeek.length >= 3) break;
        topThreeNextWeek.push(milestone);
      }
    }
    while (topThreeNextWeek.length < 3) {
      topThreeNextWeek.push("Protect two 90-minute deep work blocks and close one key task.");
    }

    const runwayCommentary =
      runway.monthsOfFreedom >= 18
        ? `Runway is strong at ${runway.monthsOfFreedom} months. Keep momentum and protect margin by clearing at least one high-cost distraction.`
        : runway.monthsOfFreedom >= 9
          ? `Runway is stable at ${runway.monthsOfFreedom} months. Maintain expense discipline and complete top-priority outcomes before adding new commitments.`
          : `Runway is tight at ${runway.monthsOfFreedom} months. Prioritize revenue-protecting tasks and reduce non-essential expenses this week.`;

    return {
      reviewDate: request.reviewDate,
      wins,
      stuck: stuck.length ? stuck : ["No major blockers captured. Keep monitoring WAITING tasks."],
      topThreeNextWeek: topThreeNextWeek.slice(0, 3),
      runwayCommentary,
      generatedAt: new Date().toISOString(),
    };
  }

  async listReviews(limit = 12): Promise<ReviewNote[]> {
    const normalizedLimit = Math.max(1, Math.min(50, Math.round(limit)));

    if (!this.notion) {
      return [...memoryStore.get().reviews]
        .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate))
        .slice(0, normalizedLimit);
    }

    const dbId = this.requireDatabaseId("reviews");
    const response = await this.queryAllPages(dbId);
    return response
      .map(mapNotionPageToReview)
      .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate))
      .slice(0, normalizedLimit);
  }

  async createReviewNote(input: CreateReviewNoteInput): Promise<ReviewNote> {
    if (!input.reviewDate) {
      throw new Error("reviewDate is required.");
    }

    const normalize = (items: string[]): string[] =>
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12);

    const payload: ReviewNote = {
      id: `review_${crypto.randomUUID()}`,
      reviewDate: toIso(input.reviewDate) ?? new Date().toISOString(),
      wins: normalize(input.wins),
      stuck: normalize(input.stuck),
      topThreeNextWeek: normalize(input.topThreeNextWeek).slice(0, 3),
      runwayCommentary: input.runwayCommentary?.trim() || "",
    };

    if (!this.notion) {
      const snapshot = memoryStore.get();
      snapshot.reviews.unshift(payload);
      return payload;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("reviews") },
      properties: {
        review_date: { date: { start: payload.reviewDate } },
        wins: textProperty(payload.wins.join(" | ")),
        stuck: textProperty(payload.stuck.join(" | ")),
        top_three_next_week: textProperty(payload.topThreeNextWeek.join(" | ")),
        runway_commentary: textProperty(payload.runwayCommentary),
      },
    })) as any;

    return mapNotionPageToReview(page);
  }

  async getRunway(): Promise<RunwayResult> {
    const [metrics, transactions] = await Promise.all([this.listMetrics(), this.listTransactions()]);
    const financeSnapshot = deriveFinanceMetricSnapshot(metrics);
    const { totalAssets, totalLiabilities, liquidAssets, netWorth } = financeSnapshot;

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
      netWorth: round2(netWorth),
      totalAssets: round2(totalAssets),
      totalLiabilities: round2(totalLiabilities),
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

  async createHealthLog(input: CreateHealthLogInput): Promise<HealthDailyLog> {
    if (!input.date || !input.entityId) {
      throw new Error("date and entityId are required.");
    }

    const payload: HealthDailyLog = {
      id: `health_${crypto.randomUUID()}`,
      date: toIso(input.date) ?? new Date().toISOString(),
      entityId: input.entityId,
      steps: Number(input.steps ?? 0),
      sleepHours: Number(input.sleepHours ?? 0),
      restingHeartRate: Number(input.restingHeartRate ?? 0),
      hydrationLiters: Number(input.hydrationLiters ?? 0),
      recoveryScore: Number(input.recoveryScore ?? 0),
      weightKg: input.weightKg !== undefined ? Number(input.weightKg) : undefined,
    };

    if (!this.notion) {
      memoryStore.get().healthLogs.unshift(payload);
      return payload;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("healthLogs") },
      properties: {
        date: { date: { start: input.date } },
        entity: { relation: [{ id: input.entityId }] },
        steps: { number: payload.steps },
        sleep_hours: { number: payload.sleepHours },
        resting_hr: { number: payload.restingHeartRate },
        hydration_liters: { number: payload.hydrationLiters },
        recovery_score: { number: payload.recoveryScore },
        weight_kg: { number: payload.weightKg ?? null },
      },
    })) as any;

    return mapNotionPageToHealthLog(page);
  }

  async updateHealthLog(id: string, input: UpdateHealthLogInput): Promise<HealthDailyLog> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.healthLogs.findIndex((log) => log.id === id);
      if (index < 0) {
        throw new Error(`Health log not found: ${id}`);
      }
      const existing = snapshot.healthLogs[index];
      if (!existing) {
        throw new Error(`Health log not found: ${id}`);
      }
      const updated: HealthDailyLog = {
        ...existing,
        ...input,
        date: input.date !== undefined ? toIso(input.date) ?? existing.date : existing.date,
      };
      snapshot.healthLogs[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.date !== undefined) properties.date = input.date ? { date: { start: input.date } } : { date: null };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.steps !== undefined) properties.steps = { number: Number(input.steps) };
    if (input.sleepHours !== undefined) properties.sleep_hours = { number: Number(input.sleepHours) };
    if (input.restingHeartRate !== undefined) properties.resting_hr = { number: Number(input.restingHeartRate) };
    if (input.hydrationLiters !== undefined) properties.hydration_liters = { number: Number(input.hydrationLiters) };
    if (input.recoveryScore !== undefined) properties.recovery_score = { number: Number(input.recoveryScore) };
    if (input.weightKg !== undefined) properties.weight_kg = { number: input.weightKg ?? null };

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToHealthLog(page);
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

  async createWorkout(input: CreateWorkoutInput): Promise<WorkoutSession> {
    if (!input.date || !input.entityId) {
      throw new Error("date and entityId are required.");
    }

    const payload: WorkoutSession = {
      id: `workout_${crypto.randomUUID()}`,
      date: toIso(input.date) ?? new Date().toISOString(),
      entityId: input.entityId,
      sessionType: input.sessionType,
      intensity: input.intensity,
      durationMinutes: Number(input.durationMinutes ?? 0),
      volumeLoadKg: input.volumeLoadKg !== undefined ? Number(input.volumeLoadKg) : undefined,
      notes: input.notes?.trim() || undefined,
    };

    if (!this.notion) {
      memoryStore.get().workouts.unshift(payload);
      return payload;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("workouts") },
      properties: {
        date: { date: { start: input.date } },
        entity: { relation: [{ id: input.entityId }] },
        session_type: { select: { name: input.sessionType } },
        intensity: { select: { name: input.intensity } },
        duration_minutes: { number: Number(input.durationMinutes ?? 0) },
        volume_load_kg: { number: input.volumeLoadKg ?? null },
        notes: textProperty(input.notes?.trim() ?? ""),
      },
    })) as any;

    return mapNotionPageToWorkout(page);
  }

  async updateWorkout(id: string, input: UpdateWorkoutInput): Promise<WorkoutSession> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.workouts.findIndex((workout) => workout.id === id);
      if (index < 0) {
        throw new Error(`Workout not found: ${id}`);
      }
      const existing = snapshot.workouts[index];
      if (!existing) {
        throw new Error(`Workout not found: ${id}`);
      }
      const updated: WorkoutSession = {
        ...existing,
        ...input,
        date: input.date !== undefined ? toIso(input.date) ?? existing.date : existing.date,
        notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      };
      snapshot.workouts[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.date !== undefined) properties.date = input.date ? { date: { start: input.date } } : { date: null };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.sessionType !== undefined) properties.session_type = { select: { name: input.sessionType } };
    if (input.intensity !== undefined) properties.intensity = { select: { name: input.intensity } };
    if (input.durationMinutes !== undefined) properties.duration_minutes = { number: Number(input.durationMinutes) };
    if (input.volumeLoadKg !== undefined) properties.volume_load_kg = { number: input.volumeLoadKg ?? null };
    if (input.notes !== undefined) properties.notes = textProperty(input.notes.trim());

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToWorkout(page);
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

  async createFamilyEvent(input: CreateFamilyEventInput): Promise<FamilyEvent> {
    if (!input.title?.trim() || !input.date) {
      throw new Error("title and date are required.");
    }

    const payload: FamilyEvent = {
      id: `family_event_${crypto.randomUUID()}`,
      title: input.title.trim(),
      date: toIso(input.date) ?? new Date().toISOString(),
      category: input.category,
      importance: input.importance,
      entityId: input.entityId,
      notes: input.notes?.trim() || undefined,
    };

    if (!this.notion) {
      memoryStore.get().familyEvents.unshift(payload);
      return payload;
    }

    const properties: Record<string, unknown> = {
      title: titleProperty(payload.title),
      date: { date: { start: input.date } },
      category: { select: { name: input.category } },
      importance: { select: { name: input.importance } },
      notes: textProperty(input.notes?.trim() ?? ""),
    };
    if (input.entityId) properties.entity = { relation: [{ id: input.entityId }] };

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("familyEvents") },
      properties,
    })) as any;
    return mapNotionPageToFamilyEvent(page);
  }

  async updateFamilyEvent(id: string, input: UpdateFamilyEventInput): Promise<FamilyEvent> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.familyEvents.findIndex((event) => event.id === id);
      if (index < 0) {
        throw new Error(`Family event not found: ${id}`);
      }
      const existing = snapshot.familyEvents[index];
      if (!existing) {
        throw new Error(`Family event not found: ${id}`);
      }
      const updated: FamilyEvent = {
        ...existing,
        ...input,
        title: input.title !== undefined ? input.title.trim() || existing.title : existing.title,
        date: input.date !== undefined ? toIso(input.date) ?? existing.date : existing.date,
        notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      };
      snapshot.familyEvents[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.title !== undefined) properties.title = titleProperty(input.title.trim() || "Event");
    if (input.date !== undefined) properties.date = input.date ? { date: { start: input.date } } : { date: null };
    if (input.category !== undefined) properties.category = { select: { name: input.category } };
    if (input.importance !== undefined) properties.importance = { select: { name: input.importance } };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.notes !== undefined) properties.notes = textProperty(input.notes.trim());

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToFamilyEvent(page);
  }

  async listRelationshipCheckins(): Promise<RelationshipCheckin[]> {
    if (!this.notion) {
      return [...memoryStore.get().relationshipCheckins];
    }

    const dbId = this.requireDatabaseId("relationshipCheckins");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToRelationshipCheckin);
  }

  async createRelationshipCheckin(input: CreateRelationshipCheckinInput): Promise<RelationshipCheckin> {
    if (!input.person?.trim() || !input.lastMeaningfulContact) {
      throw new Error("person and lastMeaningfulContact are required.");
    }

    const payload: RelationshipCheckin = {
      id: `checkin_${crypto.randomUUID()}`,
      person: input.person.trim(),
      relationType: input.relationType,
      lastMeaningfulContact: toIso(input.lastMeaningfulContact) ?? new Date().toISOString(),
      targetCadenceDays: Number(input.targetCadenceDays ?? 7),
      entityId: input.entityId,
      notes: input.notes?.trim() || undefined,
    };

    if (!this.notion) {
      memoryStore.get().relationshipCheckins.unshift(payload);
      return payload;
    }

    const properties: Record<string, unknown> = {
      person: titleProperty(payload.person),
      relation_type: { select: { name: input.relationType } },
      last_meaningful_contact: { date: { start: input.lastMeaningfulContact } },
      target_cadence_days: { number: Number(input.targetCadenceDays ?? 7) },
      notes: textProperty(input.notes?.trim() ?? ""),
    };
    if (input.entityId) properties.entity = { relation: [{ id: input.entityId }] };

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("relationshipCheckins") },
      properties,
    })) as any;
    return mapNotionPageToRelationshipCheckin(page);
  }

  async updateRelationshipCheckin(id: string, input: UpdateRelationshipCheckinInput): Promise<RelationshipCheckin> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.relationshipCheckins.findIndex((checkin) => checkin.id === id);
      if (index < 0) {
        throw new Error(`Relationship check-in not found: ${id}`);
      }
      const existing = snapshot.relationshipCheckins[index];
      if (!existing) {
        throw new Error(`Relationship check-in not found: ${id}`);
      }
      const updated: RelationshipCheckin = {
        ...existing,
        ...input,
        person: input.person !== undefined ? input.person.trim() || existing.person : existing.person,
        lastMeaningfulContact:
          input.lastMeaningfulContact !== undefined
            ? toIso(input.lastMeaningfulContact) ?? existing.lastMeaningfulContact
            : existing.lastMeaningfulContact,
        notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      };
      snapshot.relationshipCheckins[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.person !== undefined) properties.person = titleProperty(input.person.trim() || "Person");
    if (input.relationType !== undefined) properties.relation_type = { select: { name: input.relationType } };
    if (input.lastMeaningfulContact !== undefined) {
      properties.last_meaningful_contact = input.lastMeaningfulContact
        ? { date: { start: input.lastMeaningfulContact } }
        : { date: null };
    }
    if (input.targetCadenceDays !== undefined) properties.target_cadence_days = { number: Number(input.targetCadenceDays) };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.notes !== undefined) properties.notes = textProperty(input.notes.trim());

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToRelationshipCheckin(page);
  }

  async listTimeOffPlans(): Promise<TimeOffPlan[]> {
    if (!this.notion) {
      return [...memoryStore.get().timeOffPlans];
    }

    const dbId = this.requireDatabaseId("timeOffPlans");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToTimeOffPlan);
  }

  async createTimeOffPlan(input: CreateTimeOffPlanInput): Promise<TimeOffPlan> {
    if (!input.title?.trim()) {
      throw new Error("title is required.");
    }
    if (!Number.isFinite(input.estimatedCostAud)) {
      throw new Error("estimatedCostAud must be numeric.");
    }

    const payload: TimeOffPlan = {
      id: `timeoff_${crypto.randomUUID()}`,
      title: input.title.trim(),
      status: input.status,
      targetDate: input.targetDate ? toIso(input.targetDate) : undefined,
      estimatedCostAud: Number(input.estimatedCostAud),
      priority: input.priority,
      entityId: input.entityId,
      notes: input.notes?.trim() || undefined,
    };

    if (!this.notion) {
      memoryStore.get().timeOffPlans.unshift(payload);
      return payload;
    }

    const properties: Record<string, unknown> = {
      title: titleProperty(payload.title),
      status: { select: { name: input.status } },
      target_date: input.targetDate ? { date: { start: input.targetDate } } : { date: null },
      estimated_cost_aud: { number: Number(input.estimatedCostAud) },
      priority: { select: { name: input.priority } },
      notes: textProperty(input.notes?.trim() ?? ""),
    };
    if (input.entityId) properties.entity = { relation: [{ id: input.entityId }] };

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("timeOffPlans") },
      properties,
    })) as any;
    return mapNotionPageToTimeOffPlan(page);
  }

  async updateTimeOffPlan(id: string, input: UpdateTimeOffPlanInput): Promise<TimeOffPlan> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.timeOffPlans.findIndex((plan) => plan.id === id);
      if (index < 0) {
        throw new Error(`Time-off plan not found: ${id}`);
      }
      const existing = snapshot.timeOffPlans[index];
      if (!existing) {
        throw new Error(`Time-off plan not found: ${id}`);
      }
      const updated: TimeOffPlan = {
        ...existing,
        ...input,
        title: input.title !== undefined ? input.title.trim() || existing.title : existing.title,
        targetDate: input.targetDate !== undefined ? (input.targetDate ? toIso(input.targetDate) : undefined) : existing.targetDate,
        notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      };
      snapshot.timeOffPlans[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.title !== undefined) properties.title = titleProperty(input.title.trim() || "Plan");
    if (input.status !== undefined) properties.status = { select: { name: input.status } };
    if (input.targetDate !== undefined) properties.target_date = input.targetDate ? { date: { start: input.targetDate } } : { date: null };
    if (input.estimatedCostAud !== undefined) properties.estimated_cost_aud = { number: Number(input.estimatedCostAud) };
    if (input.priority !== undefined) properties.priority = { select: { name: input.priority } };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.notes !== undefined) properties.notes = textProperty(input.notes.trim());

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToTimeOffPlan(page);
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

  async createPathway(input: CreatePathwayInput): Promise<Pathway> {
    if (!input.title?.trim()) {
      throw new Error("Pathway title is required.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const pathway: Pathway = {
        id: `pathway_${crypto.randomUUID()}`,
        title: input.title.trim(),
        status: input.status ?? "ACTIVE",
        progressPercent: Math.max(0, Math.min(100, input.progressPercent ?? 0)),
      };
      snapshot.pathways.unshift(pathway);
      return pathway;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("pathways") },
      properties: {
        title: titleProperty(input.title.trim()),
        status: { select: { name: input.status ?? "ACTIVE" } },
        progress_percent: { number: Math.max(0, Math.min(100, input.progressPercent ?? 0)) },
      },
    })) as any;

    return mapNotionPageToPathway(page);
  }

  async updatePathway(id: string, input: UpdatePathwayInput): Promise<Pathway> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.pathways.findIndex((pathway) => pathway.id === id);
      if (index < 0) {
        throw new Error(`Pathway not found: ${id}`);
      }
      const existing = snapshot.pathways[index];
      if (!existing) {
        throw new Error(`Pathway not found: ${id}`);
      }
      const updated: Pathway = {
        ...existing,
        ...input,
        title: input.title !== undefined ? input.title.trim() || existing.title : existing.title,
        progressPercent:
          typeof input.progressPercent === "number"
            ? Math.max(0, Math.min(100, input.progressPercent))
            : existing.progressPercent,
      };
      snapshot.pathways[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.title !== undefined) properties.title = titleProperty(input.title.trim() || "Untitled Pathway");
    if (input.status !== undefined) properties.status = { select: { name: input.status } };
    if (typeof input.progressPercent === "number") {
      properties.progress_percent = { number: Math.max(0, Math.min(100, input.progressPercent)) };
    }

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToPathway(page);
  }

  async listCourses(): Promise<CourseCert[]> {
    if (!this.notion) {
      return memoryStore.get().courses;
    }

    const dbId = this.requireDatabaseId("coursesCerts");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToCourse);
  }

  async createCourse(input: CreateCourseCertInput): Promise<CourseCert> {
    if (!input.title?.trim()) {
      throw new Error("Course/Cert title is required.");
    }
    if (!input.pathwayId) {
      throw new Error("Course/Cert pathwayId is required.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const course: CourseCert = {
        id: `course_${crypto.randomUUID()}`,
        title: input.title.trim(),
        pathwayId: input.pathwayId,
        status: input.status ?? "NOT_STARTED",
        targetDate: toIso(input.targetDate),
        estimatedHours: input.estimatedHours,
        completedHours: input.completedHours,
        proofUrls: input.proofUrls ?? [],
        appliedProjectIds: input.appliedProjectIds ?? [],
        appliedProgressPercent: Math.max(0, Math.min(100, input.appliedProgressPercent ?? 0)),
      };
      snapshot.courses.unshift(course);
      return course;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("coursesCerts") },
      properties: {
        course_cert: titleProperty(input.title.trim()),
        pathway: { relation: [{ id: input.pathwayId }] },
        status: { select: { name: input.status ?? "NOT_STARTED" } },
        target_date: input.targetDate ? { date: { start: input.targetDate } } : { date: null },
        estimated_hours: { number: input.estimatedHours ?? null },
        completed_hours: { number: input.completedHours ?? null },
        proof: { files: [] },
        applied_projects: { relation: (input.appliedProjectIds ?? []).map((id) => ({ id })) },
        applied_progress_percent: { number: Math.max(0, Math.min(100, input.appliedProgressPercent ?? 0)) },
      },
    })) as any;

    return mapNotionPageToCourse(page);
  }

  async updateCourse(id: string, input: UpdateCourseCertInput): Promise<CourseCert> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.courses.findIndex((course) => course.id === id);
      if (index < 0) {
        throw new Error(`Course/Cert not found: ${id}`);
      }
      const existing = snapshot.courses[index];
      if (!existing) {
        throw new Error(`Course/Cert not found: ${id}`);
      }
      const updated: CourseCert = {
        ...existing,
        ...input,
        title: input.title !== undefined ? input.title.trim() || existing.title : existing.title,
        targetDate: input.targetDate !== undefined ? toIso(input.targetDate) : existing.targetDate,
        proofUrls: input.proofUrls ?? existing.proofUrls,
        appliedProjectIds: input.appliedProjectIds ?? existing.appliedProjectIds,
        appliedProgressPercent:
          typeof input.appliedProgressPercent === "number"
            ? Math.max(0, Math.min(100, input.appliedProgressPercent))
            : existing.appliedProgressPercent,
      };
      snapshot.courses[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.title !== undefined) properties.course_cert = titleProperty(input.title.trim() || "Untitled Course");
    if (input.pathwayId !== undefined) properties.pathway = { relation: input.pathwayId ? [{ id: input.pathwayId }] : [] };
    if (input.status !== undefined) properties.status = { select: { name: input.status } };
    if (input.targetDate !== undefined) properties.target_date = input.targetDate ? { date: { start: input.targetDate } } : { date: null };
    if (input.estimatedHours !== undefined) properties.estimated_hours = { number: input.estimatedHours ?? null };
    if (input.completedHours !== undefined) properties.completed_hours = { number: input.completedHours ?? null };
    if (input.appliedProjectIds !== undefined) {
      properties.applied_projects = { relation: input.appliedProjectIds.map((projectId) => ({ id: projectId })) };
    }
    if (input.appliedProgressPercent !== undefined) {
      properties.applied_progress_percent = { number: Math.max(0, Math.min(100, input.appliedProgressPercent)) };
    }

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToCourse(page);
  }

  async listTransactions(): Promise<Transaction[]> {
    if (!this.notion) {
      return memoryStore.get().transactions;
    }

    const dbId = this.requireDatabaseId("transactions");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToTransaction);
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    if (!input.date || !input.entityId || !input.type || !input.category?.trim()) {
      throw new Error("date, entityId, type, and category are required.");
    }
    if (!Number.isFinite(input.amount)) {
      throw new Error("amount must be a valid number.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const transaction: Transaction = {
        id: `txn_${crypto.randomUUID()}`,
        date: toIso(input.date) ?? new Date().toISOString(),
        amount: Number(input.amount),
        type: input.type,
        entityId: input.entityId,
        category: input.category.trim(),
        notes: input.notes?.trim() || undefined,
      };
      snapshot.transactions.unshift(transaction);
      return transaction;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("transactions") },
      properties: {
        date: { date: { start: input.date } },
        amount: { number: Number(input.amount) },
        type: { select: { name: input.type } },
        entity: { relation: [{ id: input.entityId }] },
        category: { select: { name: input.category.trim() } },
        notes: textProperty(input.notes?.trim() ?? ""),
      },
    })) as any;

    return mapNotionPageToTransaction(page);
  }

  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.transactions.findIndex((transaction) => transaction.id === id);
      if (index < 0) {
        throw new Error(`Transaction not found: ${id}`);
      }
      const existing = snapshot.transactions[index];
      if (!existing) {
        throw new Error(`Transaction not found: ${id}`);
      }
      const updated: Transaction = {
        ...existing,
        ...input,
        date: input.date !== undefined ? toIso(input.date) ?? existing.date : existing.date,
        amount: input.amount !== undefined ? Number(input.amount) : existing.amount,
        category: input.category !== undefined ? input.category.trim() || existing.category : existing.category,
        notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      };
      snapshot.transactions[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.date !== undefined) properties.date = input.date ? { date: { start: input.date } } : { date: null };
    if (input.amount !== undefined) properties.amount = { number: Number(input.amount) };
    if (input.type !== undefined) properties.type = { select: { name: input.type } };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.category !== undefined) properties.category = { select: { name: input.category.trim() || "Other" } };
    if (input.notes !== undefined) properties.notes = textProperty(input.notes.trim());

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToTransaction(page);
  }

  async listMetrics(): Promise<LosDataSnapshot["metrics"]> {
    if (!this.notion) {
      return memoryStore.get().metrics;
    }

    const dbId = this.requireDatabaseId("metrics");
    const response = await this.queryAllPages(dbId);
    return response.map(mapNotionPageToMetric);
  }

  async createMetric(input: CreateMetricInput): Promise<MetricPoint> {
    if (!input.metricName?.trim() || !input.category || !input.unit || !input.date) {
      throw new Error("metricName, category, unit, and date are required.");
    }
    if (!Number.isFinite(input.value)) {
      throw new Error("value must be a valid number.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const metric: MetricPoint = {
        id: `metric_${crypto.randomUUID()}`,
        metricName: input.metricName.trim(),
        category: input.category,
        value: Number(input.value),
        unit: input.unit,
        date: toIso(input.date) ?? new Date().toISOString(),
        entityId: input.entityId,
        projectId: input.projectId,
      };
      snapshot.metrics.unshift(metric);
      return metric;
    }

    const properties: Record<string, unknown> = {
      metric_name: titleProperty(input.metricName.trim()),
      category: { select: { name: input.category } },
      value: { number: Number(input.value) },
      unit: { select: { name: input.unit } },
      date: { date: { start: input.date } },
    };
    if (input.entityId) properties.entity = { relation: [{ id: input.entityId }] };
    if (input.projectId) properties.project = { relation: [{ id: input.projectId }] };

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("metrics") },
      properties,
    })) as any;

    return mapNotionPageToMetric(page);
  }

  async updateMetric(id: string, input: UpdateMetricInput): Promise<MetricPoint> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.metrics.findIndex((metric) => metric.id === id);
      if (index < 0) {
        throw new Error(`Metric not found: ${id}`);
      }
      const existing = snapshot.metrics[index];
      if (!existing) {
        throw new Error(`Metric not found: ${id}`);
      }
      const updated: MetricPoint = {
        ...existing,
        ...input,
        metricName: input.metricName !== undefined ? input.metricName.trim() || existing.metricName : existing.metricName,
        value: input.value !== undefined ? Number(input.value) : existing.value,
        date: input.date !== undefined ? toIso(input.date) ?? existing.date : existing.date,
      };
      snapshot.metrics[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.metricName !== undefined) properties.metric_name = titleProperty(input.metricName.trim() || "Metric");
    if (input.category !== undefined) properties.category = { select: { name: input.category } };
    if (input.value !== undefined) properties.value = { number: Number(input.value) };
    if (input.unit !== undefined) properties.unit = { select: { name: input.unit } };
    if (input.date !== undefined) properties.date = input.date ? { date: { start: input.date } } : { date: null };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.projectId !== undefined) properties.project = { relation: input.projectId ? [{ id: input.projectId }] : [] };

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToMetric(page);
  }

  async createUpcomingExpense(input: CreateUpcomingExpenseInput): Promise<UpcomingExpense> {
    if (!input.bill?.trim() || !input.entityId || !input.frequency || !input.dueDate) {
      throw new Error("bill, entityId, frequency, and dueDate are required.");
    }
    if (!Number.isFinite(input.amount)) {
      throw new Error("amount must be a valid number.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const expense: UpcomingExpense = {
        id: `upcoming_${crypto.randomUUID()}`,
        bill: input.bill.trim(),
        amount: Number(input.amount),
        dueDate: toIso(input.dueDate) ?? new Date().toISOString(),
        frequency: input.frequency,
        entityId: input.entityId,
        paid: input.paid ?? false,
      };
      snapshot.upcomingExpenses.unshift(expense);
      return expense;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("upcomingExpenses") },
      properties: {
        bill: titleProperty(input.bill.trim()),
        amount: { number: Number(input.amount) },
        due_date: { date: { start: input.dueDate } },
        frequency: { select: { name: input.frequency } },
        entity: { relation: [{ id: input.entityId }] },
        paid: { checkbox: input.paid ?? false },
      },
    })) as any;

    return mapNotionPageToUpcomingExpense(page);
  }

  async updateUpcomingExpense(id: string, input: UpdateUpcomingExpenseInput): Promise<UpcomingExpense> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.upcomingExpenses.findIndex((expense) => expense.id === id);
      if (index < 0) {
        throw new Error(`Upcoming expense not found: ${id}`);
      }
      const existing = snapshot.upcomingExpenses[index];
      if (!existing) {
        throw new Error(`Upcoming expense not found: ${id}`);
      }
      const updated: UpcomingExpense = {
        ...existing,
        ...input,
        bill: input.bill !== undefined ? input.bill.trim() || existing.bill : existing.bill,
        amount: input.amount !== undefined ? Number(input.amount) : existing.amount,
        dueDate: input.dueDate !== undefined ? toIso(input.dueDate) ?? existing.dueDate : existing.dueDate,
      };
      snapshot.upcomingExpenses[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.bill !== undefined) properties.bill = titleProperty(input.bill.trim() || "Expense");
    if (input.amount !== undefined) properties.amount = { number: Number(input.amount) };
    if (input.dueDate !== undefined) properties.due_date = input.dueDate ? { date: { start: input.dueDate } } : { date: null };
    if (input.frequency !== undefined) properties.frequency = { select: { name: input.frequency } };
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.paid !== undefined) properties.paid = { checkbox: input.paid };

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToUpcomingExpense(page);
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
      reviews,
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
      this.listReviews(),
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
      reviews,
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

  async createAccount(input: CreateAccountInput): Promise<AccountRef> {
    if (!input.service?.trim() || !input.entityId) {
      throw new Error("service and entityId are required.");
    }

    if (!this.notion) {
      const snapshot = memoryStore.get();
      const account: AccountRef = {
        id: `acc_${crypto.randomUUID()}`,
        service: input.service.trim(),
        entityId: input.entityId,
        loginIdentifier: input.loginIdentifier?.trim() ?? "",
        role: input.role ?? "USER",
        twoFactorEnabled: input.twoFactorEnabled ?? false,
        vaultItemUrl: input.vaultItemUrl?.trim() ?? "",
        vaultItemId: input.vaultItemId?.trim() || undefined,
        lastRotated: input.lastRotated ? toIso(input.lastRotated) : undefined,
        notes: input.notes?.trim() || undefined,
      };
      snapshot.accounts.unshift(account);
      return account;
    }

    const page = (await (this.notion as any).pages.create({
      parent: { database_id: this.requireDatabaseId("accounts") },
      properties: {
        service: titleProperty(input.service.trim()),
        entity: { relation: [{ id: input.entityId }] },
        login_identifier: textProperty(input.loginIdentifier?.trim() ?? ""),
        role: { select: { name: input.role ?? "USER" } },
        "2fa_enabled": { checkbox: input.twoFactorEnabled ?? false },
        vault_item_url: textProperty(input.vaultItemUrl?.trim() ?? ""),
        vault_item_id: textProperty(input.vaultItemId?.trim() ?? ""),
        last_rotated: input.lastRotated ? { date: { start: input.lastRotated } } : { date: null },
        notes: textProperty(input.notes?.trim() ?? ""),
      },
    })) as any;

    return mapNotionPageToAccount(page);
  }

  async updateAccount(id: string, input: UpdateAccountInput): Promise<AccountRef> {
    if (!this.notion) {
      const snapshot = memoryStore.get();
      const index = snapshot.accounts.findIndex((account) => account.id === id);
      if (index < 0) {
        throw new Error(`Account not found: ${id}`);
      }
      const existing = snapshot.accounts[index];
      if (!existing) {
        throw new Error(`Account not found: ${id}`);
      }
      const updated: AccountRef = {
        ...existing,
        ...input,
        service: input.service !== undefined ? input.service.trim() || existing.service : existing.service,
        loginIdentifier:
          input.loginIdentifier !== undefined ? input.loginIdentifier.trim() : existing.loginIdentifier,
        vaultItemUrl: input.vaultItemUrl !== undefined ? input.vaultItemUrl.trim() : existing.vaultItemUrl,
        vaultItemId: input.vaultItemId !== undefined ? input.vaultItemId.trim() || undefined : existing.vaultItemId,
        lastRotated: input.lastRotated !== undefined ? (input.lastRotated ? toIso(input.lastRotated) : undefined) : existing.lastRotated,
        notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      };
      snapshot.accounts[index] = updated;
      return updated;
    }

    const properties: Record<string, unknown> = {};
    if (input.service !== undefined) properties.service = titleProperty(input.service.trim() || "Service");
    if (input.entityId !== undefined) properties.entity = { relation: input.entityId ? [{ id: input.entityId }] : [] };
    if (input.loginIdentifier !== undefined) properties.login_identifier = textProperty(input.loginIdentifier.trim());
    if (input.role !== undefined) properties.role = { select: { name: input.role } };
    if (input.twoFactorEnabled !== undefined) properties["2fa_enabled"] = { checkbox: input.twoFactorEnabled };
    if (input.vaultItemUrl !== undefined) properties.vault_item_url = textProperty(input.vaultItemUrl.trim());
    if (input.vaultItemId !== undefined) properties.vault_item_id = textProperty(input.vaultItemId.trim());
    if (input.lastRotated !== undefined) {
      properties.last_rotated = input.lastRotated ? { date: { start: input.lastRotated } } : { date: null };
    }
    if (input.notes !== undefined) properties.notes = textProperty(input.notes.trim());

    const page = (await (this.notion as any).pages.update({ page_id: id, properties })) as any;
    return mapNotionPageToAccount(page);
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
