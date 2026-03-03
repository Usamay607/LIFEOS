export type Id = string;

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "CEASED";
export type TaskStatus = "NEXT" | "DOING" | "WAITING" | "DONE";
export type EntityStatus = "ACTIVE" | "DORMANT" | "ARCHIVED";
export type CourseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type AreaColor =
  | "EMERALD"
  | "BLUE"
  | "PURPLE"
  | "ORANGE"
  | "ROSE"
  | "SLATE";

export interface Area {
  id: Id;
  name: string;
  color: AreaColor;
  active: boolean;
}

export interface Entity {
  id: Id;
  name: string;
  areaId: Id;
  type: "PERSONAL" | "BUSINESS" | "PROJECT" | "CLIENT" | "ROLE" | "ADMIN";
  status: EntityStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface Project {
  id: Id;
  name: string;
  entityId: Id;
  status: ProjectStatus;
  nextMilestone?: string;
  deadline?: string;
  skillsUsedCourseIds: Id[];
  postMortem?: string;
}

export interface Task {
  id: Id;
  title: string;
  projectId: Id;
  status: TaskStatus;
  dueDate?: string;
  energy: "LOW" | "MEDIUM" | "HIGH";
  context: "LAPTOP" | "PHONE" | "ERRANDS" | "CALLS";
  recurring: boolean;
  notes?: string;
  createdAt: string;
}

export interface Pathway {
  id: Id;
  title: string;
  status: "ACTIVE" | "LATER" | "COMPLETED";
  progressPercent: number;
}

export interface CourseCert {
  id: Id;
  title: string;
  pathwayId: Id;
  status: CourseStatus;
  targetDate?: string;
  estimatedHours?: number;
  completedHours?: number;
  proofUrls: string[];
  appliedProjectIds: Id[];
  appliedProgressPercent: number;
}

export interface AccountRef {
  id: Id;
  service: string;
  entityId: Id;
  loginIdentifier: string;
  role: "OWNER" | "ADMIN" | "USER";
  twoFactorEnabled: boolean;
  vaultItemUrl: string;
  vaultItemId?: string;
  lastRotated?: string;
  notes?: string;
}

export interface Transaction {
  id: Id;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  entityId: Id;
  category: string;
  notes?: string;
}

export interface UpcomingExpense {
  id: Id;
  bill: string;
  amount: number;
  dueDate: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_OFF";
  entityId: Id;
  paid: boolean;
}

export interface MetricPoint {
  id: Id;
  metricName: string;
  category: "FINANCE" | "HEALTH" | "LEARNING" | "WORK" | "LIFE";
  value: number;
  unit: "AUD" | "KG" | "PERCENT" | "HOURS" | "COUNT";
  date: string;
  entityId?: Id;
  projectId?: Id;
}

export interface ReviewNote {
  id: Id;
  reviewDate: string;
  wins: string[];
  stuck: string[];
  topThreeNextWeek: string[];
  runwayCommentary: string;
}

export interface JournalEntry {
  id: Id;
  date: string;
  title: string;
  entry: string;
  mood: "GREAT" | "GOOD" | "NEUTRAL" | "LOW";
  tags: string[];
  entityId?: Id;
  energyScore?: number;
  focusScore?: number;
}

export interface HealthDailyLog {
  id: Id;
  date: string;
  entityId: Id;
  steps: number;
  sleepHours: number;
  restingHeartRate: number;
  hydrationLiters: number;
  recoveryScore: number;
  weightKg?: number;
}

export interface WorkoutSession {
  id: Id;
  date: string;
  entityId: Id;
  sessionType: "STRENGTH" | "CARDIO" | "MOBILITY" | "SPORT" | "RECOVERY";
  intensity: "LOW" | "MEDIUM" | "HIGH";
  durationMinutes: number;
  volumeLoadKg?: number;
  notes?: string;
}

export interface HealthOverview {
  generatedAt: string;
  latestLog?: HealthDailyLog;
  weeklyAverages: {
    steps: number;
    sleepHours: number;
    restingHeartRate: number;
    hydrationLiters: number;
    recoveryScore: number;
  };
  workoutsThisWeek: number;
  trainingMinutesThisWeek: number;
  byType: Record<WorkoutSession["sessionType"], number>;
  trend: {
    stepsDelta: number;
    sleepDelta: number;
    recoveryDelta: number;
  };
}

export interface FamilyEvent {
  id: Id;
  title: string;
  date: string;
  category: "BIRTHDAY" | "ANNIVERSARY" | "SOCIAL" | "FAMILY" | "ADMIN";
  importance: "LOW" | "MEDIUM" | "HIGH";
  entityId?: Id;
  notes?: string;
}

export interface RelationshipCheckin {
  id: Id;
  person: string;
  relationType: "FAMILY" | "FRIEND" | "MENTOR" | "PARTNER";
  lastMeaningfulContact: string;
  targetCadenceDays: number;
  entityId?: Id;
  notes?: string;
}

export interface FamilyOverview {
  generatedAt: string;
  upcomingEvents: FamilyEvent[];
  overdueRelationships: Array<
    RelationshipCheckin & {
      daysSinceContact: number;
      isOverdue: boolean;
    }
  >;
  dueSoonRelationships: Array<
    RelationshipCheckin & {
      daysSinceContact: number;
      isOverdue: boolean;
    }
  >;
}

export interface TimeOffPlan {
  id: Id;
  title: string;
  status: "PRE_SABBATICAL" | "READY" | "ACTIVE_TIME_OFF" | "COMPLETED";
  targetDate?: string;
  estimatedCostAud: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  entityId?: Id;
  notes?: string;
}

export interface TransitionOverview {
  generatedAt: string;
  runwayMonths: number;
  projectedFreedomDate?: string;
  readinessScore: number;
  preSabbaticalPlans: TimeOffPlan[];
  atRiskPlans: TimeOffPlan[];
}

export interface LearningOverview {
  generatedAt: string;
  activePathways: Array<
    Pathway & {
      coursesInProgress: number;
      totalCourses: number;
    }
  >;
  upcomingCourseDeadlines: Array<
    CourseCert & {
      daysUntilDue: number;
      atRisk: boolean;
    }
  >;
  impactScore: number;
}

export interface RunwayResult {
  liquidAssets: number;
  monthlyBurn: number;
  monthsOfFreedom: number;
}

export interface HomeDashboardData {
  generatedAt: string;
  topProjects: Project[];
  nextTasks: Task[];
  runway: RunwayResult;
  healthOverview: HealthOverview;
  familyOverview: FamilyOverview;
  transitionOverview: TransitionOverview;
  learningOverview: LearningOverview;
  upcomingExpenses: UpcomingExpense[];
  pendingTransactions: Transaction[];
}

export interface WeeklySummaryRequest {
  reviewDate: string;
  taskWindowDays: number;
  redactionLevel: RedactionLevel;
}

export interface WeeklySummaryResponse {
  summary: string;
  generatedAt: string;
  redactionApplied: RedactionLevel;
}

export interface FocusState {
  date: string;
  outcomes: string[];
  completed: boolean[];
  nextAction: string;
  blocker: string;
  updatedAt: string;
  journalEntryId?: Id;
}

export interface UpsertFocusStateInput {
  date?: string;
  outcomes: string[];
  completed: boolean[];
  nextAction?: string;
  blocker?: string;
}

export interface AssistantQueryRequest {
  question: string;
  redactionLevel: RedactionLevel;
}

export interface AssistantQueryResponse {
  answer: string;
  generatedAt: string;
  redactionApplied: RedactionLevel;
}

export interface SystemReadiness {
  generatedAt: string;
  dataMode: "mock" | "notion";
  notionTokenConfigured: boolean;
  openAiConfigured: boolean;
  requiredDatabasesTotal: number;
  configuredDatabases: number;
  missingDatabases: string[];
  connectivity: "ok" | "error" | "skipped";
  connectivityError?: string;
  dataCounts: {
    entities: number;
    projects: number;
    tasks: number;
    journalEntries: number;
  };
  startupReady: boolean;
}

export type RedactionLevel = "STRICT" | "STANDARD";

export interface TaskCompletedWebhookRequest {
  taskId: Id;
  courseCertIds?: Id[];
}

export interface CreateTaskInput {
  title: string;
  projectId: Id;
  dueDate?: string;
  energy: Task["energy"];
  context: Task["context"];
  recurring: boolean;
  notes?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  dueDate?: string;
  energy?: Task["energy"];
  context?: Task["context"];
  recurring?: boolean;
  notes?: string;
}

export interface UpdateEntityInput {
  name?: string;
  status?: EntityStatus;
  priority?: Entity["priority"];
  notes?: string;
}

export interface CreateEntityInput {
  name: string;
  areaId: Id;
  type: Entity["type"];
  status?: EntityStatus;
  priority?: Entity["priority"];
  notes?: string;
}

export interface CreateJournalEntryInput {
  title: string;
  entry: string;
  date?: string;
  mood?: JournalEntry["mood"];
  tags?: string[];
  entityId?: Id;
  energyScore?: number;
  focusScore?: number;
}

export interface LosDataSnapshot {
  areas: Area[];
  entities: Entity[];
  projects: Project[];
  tasks: Task[];
  pathways: Pathway[];
  courses: CourseCert[];
  accounts: AccountRef[];
  transactions: Transaction[];
  upcomingExpenses: UpcomingExpense[];
  metrics: MetricPoint[];
  healthLogs: HealthDailyLog[];
  workouts: WorkoutSession[];
  familyEvents: FamilyEvent[];
  relationshipCheckins: RelationshipCheckin[];
  timeOffPlans: TimeOffPlan[];
  journalEntries: JournalEntry[];
  reviews: ReviewNote[];
}
