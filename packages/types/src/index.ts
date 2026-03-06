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

export const FINANCE_METRIC_NAMES = {
  totalAssets: "Total Assets",
  totalLiabilities: "Total Liabilities",
  liquidAssets: "Liquid Assets",
  netWorth: "Net Worth",
} as const;

export type FinanceMetricKey = keyof typeof FINANCE_METRIC_NAMES;

export interface FinanceMetricSnapshot {
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  netWorth: number;
}

export type BurnBasis = "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "CURRENT_MONTH";

export interface BurnScenario {
  basis: BurnBasis;
  label: string;
  periodLabel: string;
  totalExpenses: number;
  monthlyEquivalent: number;
  runwayMonths: number;
}

export interface FinanceTrendPoint {
  label: string;
  income: number;
  expenses: number;
  net: number;
  startDate: string;
  endDate: string;
}

export interface FinanceBreakdownItem {
  label: string;
  total: number;
  sharePercent: number;
  entityId?: Id;
}

const FINANCE_METRIC_ALIASES: Record<FinanceMetricKey, string[]> = {
  totalAssets: ["total assets", "assets"],
  totalLiabilities: ["total liabilities", "liabilities"],
  liquidAssets: ["liquid assets", "available cash", "cash reserves"],
  netWorth: ["net worth"],
};

function roundFinanceValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeMetricName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getFinanceMetricKey(metricName: string): FinanceMetricKey | null {
  const normalized = normalizeMetricName(metricName);

  for (const [key, aliases] of Object.entries(FINANCE_METRIC_ALIASES) as Array<[FinanceMetricKey, string[]]>) {
    if (aliases.includes(normalized)) {
      return key;
    }
  }

  return null;
}

export function deriveFinanceMetricSnapshot(metrics: MetricPoint[]): FinanceMetricSnapshot {
  const latestByKey = new Map<FinanceMetricKey, MetricPoint>();

  const sorted = [...metrics].sort((left, right) => right.date.localeCompare(left.date));
  for (const metric of sorted) {
    const key = getFinanceMetricKey(metric.metricName);
    if (!key || latestByKey.has(key)) {
      continue;
    }
    latestByKey.set(key, metric);
  }

  const totalAssets = latestByKey.get("totalAssets")?.value ?? 0;
  const totalLiabilities = latestByKey.get("totalLiabilities")?.value ?? 0;
  const liquidAssets = latestByKey.get("liquidAssets")?.value ?? 0;
  const legacyNetWorth = latestByKey.get("netWorth")?.value;
  const hasBalanceSheetInputs = latestByKey.has("totalAssets") || latestByKey.has("totalLiabilities");
  const netWorth = hasBalanceSheetInputs ? totalAssets - totalLiabilities : (legacyNetWorth ?? liquidAssets);

  return {
    totalAssets: roundFinanceValue(totalAssets),
    totalLiabilities: roundFinanceValue(totalLiabilities),
    liquidAssets: roundFinanceValue(liquidAssets),
    netWorth: roundFinanceValue(netWorth),
  };
}

function sumMoney(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function parseTimestamp(value: string): number {
  return new Date(value).getTime();
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return { year, month, day };
}

function getMonthKey(date: Date, timeZone: string): string {
  const parts = getDatePartsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

function shiftMonthKey(key: string, delta: number): string {
  const [yearRaw, monthRaw] = key.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string, timeZone: string): string {
  const [yearRaw, monthRaw] = key.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatShortDate(dateMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(new Date(dateMs));
}

function buildBurnScenario(
  basis: BurnBasis,
  label: string,
  periodLabel: string,
  totalExpenses: number,
  monthlyEquivalent: number,
  liquidAssets: number,
): BurnScenario {
  const normalizedMonthlyEquivalent = roundFinanceValue(monthlyEquivalent);
  return {
    basis,
    label,
    periodLabel,
    totalExpenses: roundFinanceValue(totalExpenses),
    monthlyEquivalent: normalizedMonthlyEquivalent,
    runwayMonths:
      normalizedMonthlyEquivalent > 0 ? roundFinanceValue(liquidAssets / normalizedMonthlyEquivalent) : 0,
  };
}

export function deriveBurnScenarios({
  transactions,
  liquidAssets,
  now = Date.now(),
  timeZone = "Australia/Melbourne",
}: {
  transactions: Transaction[];
  liquidAssets: number;
  now?: number;
  timeZone?: string;
}): BurnScenario[] {
  const expenseTransactions = transactions.filter((transaction) => transaction.type === "EXPENSE");
  const currentMonthKey = getMonthKey(new Date(now), timeZone);
  const nowParts = getDatePartsInTimeZone(new Date(now), timeZone);
  const daysInCurrentMonth = new Date(Date.UTC(nowParts.year, nowParts.month, 0)).getUTCDate();
  const currentMonthExpenses = sumMoney(
    expenseTransactions
      .filter((transaction) => getMonthKey(new Date(transaction.date), timeZone) === currentMonthKey)
      .map((transaction) => transaction.amount),
  );

  const lastNDayExpenses = (days: number) =>
    sumMoney(
      expenseTransactions
        .filter((transaction) => parseTimestamp(transaction.date) >= now - days * 86_400_000)
        .map((transaction) => transaction.amount),
    );

  const last7Expenses = lastNDayExpenses(7);
  const last30Expenses = lastNDayExpenses(30);
  const last90Expenses = lastNDayExpenses(90);
  const currentMonthProjected =
    nowParts.day > 0 ? (currentMonthExpenses / nowParts.day) * daysInCurrentMonth : currentMonthExpenses;

  return [
    buildBurnScenario("LAST_7_DAYS", "7d spend", "Last 7 days", last7Expenses, (last7Expenses / 7) * 30, liquidAssets),
    buildBurnScenario("LAST_30_DAYS", "30d spend", "Last 30 days", last30Expenses, last30Expenses, liquidAssets),
    buildBurnScenario("LAST_90_DAYS", "90d avg burn", "Last 90 days", last90Expenses, last90Expenses / 3, liquidAssets),
    buildBurnScenario(
      "CURRENT_MONTH",
      "Month projection",
      `${nowParts.day}/${daysInCurrentMonth} days this month`,
      currentMonthExpenses,
      currentMonthProjected,
      liquidAssets,
    ),
  ];
}

export function deriveFinancePulse({
  transactions,
  upcomingExpenses,
  liquidAssets,
  totalAssets,
  totalLiabilities,
  entities = [],
  now = Date.now(),
  timeZone = "Australia/Melbourne",
}: {
  transactions: Transaction[];
  upcomingExpenses: UpcomingExpense[];
  liquidAssets: number;
  totalAssets: number;
  totalLiabilities: number;
  entities?: Entity[];
  now?: number;
  timeZone?: string;
}): FinancePulse {
  const last30Start = now - 30 * 86_400_000;
  const last90Start = now - 90 * 86_400_000;
  const last30Transactions = transactions.filter((transaction) => parseTimestamp(transaction.date) >= last30Start);
  const last90Expenses = transactions.filter(
    (transaction) => transaction.type === "EXPENSE" && parseTimestamp(transaction.date) >= last90Start,
  );
  const scenarios = deriveBurnScenarios({ transactions, liquidAssets, now, timeZone });
  const currentMonthKey = getMonthKey(new Date(now), timeZone);
  const previousMonthKey = shiftMonthKey(currentMonthKey, -1);

  const entityMap = new Map(entities.map((entity) => [entity.id, entity.name]));
  const currentMonthExpenses = sumMoney(
    transactions
      .filter(
        (transaction) =>
          transaction.type === "EXPENSE" && getMonthKey(new Date(transaction.date), timeZone) === currentMonthKey,
      )
      .map((transaction) => transaction.amount),
  );
  const previousMonthExpenses = sumMoney(
    transactions
      .filter(
        (transaction) =>
          transaction.type === "EXPENSE" && getMonthKey(new Date(transaction.date), timeZone) === previousMonthKey,
      )
      .map((transaction) => transaction.amount),
  );

  const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const bucketEnd = startOfToday.getTime() + 86_400_000 - (8 - index - 1) * 7 * 86_400_000;
    const bucketStart = bucketEnd - 7 * 86_400_000;
    const bucketTransactions = transactions.filter((transaction) => {
      const timestamp = parseTimestamp(transaction.date);
      return timestamp >= bucketStart && timestamp < bucketEnd;
    });
    const income = sumMoney(
      bucketTransactions.filter((transaction) => transaction.type === "INCOME").map((transaction) => transaction.amount),
    );
    const expenses = sumMoney(
      bucketTransactions.filter((transaction) => transaction.type === "EXPENSE").map((transaction) => transaction.amount),
    );
    return {
      label: `${formatShortDate(bucketStart, timeZone)}-${formatShortDate(bucketEnd - 86_400_000, timeZone)}`,
      income: roundFinanceValue(income),
      expenses: roundFinanceValue(expenses),
      net: roundFinanceValue(income - expenses),
      startDate: new Date(bucketStart).toISOString(),
      endDate: new Date(bucketEnd - 1).toISOString(),
    };
  });

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => shiftMonthKey(currentMonthKey, index - 5)).map((key) => {
    const bucketTransactions = transactions.filter(
      (transaction) => getMonthKey(new Date(transaction.date), timeZone) === key,
    );
    const income = sumMoney(
      bucketTransactions.filter((transaction) => transaction.type === "INCOME").map((transaction) => transaction.amount),
    );
    const expenses = sumMoney(
      bucketTransactions.filter((transaction) => transaction.type === "EXPENSE").map((transaction) => transaction.amount),
    );
    const [yearRaw, monthRaw] = key.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
    return {
      label: formatMonthLabel(key, timeZone),
      income: roundFinanceValue(income),
      expenses: roundFinanceValue(expenses),
      net: roundFinanceValue(income - expenses),
      startDate,
      endDate,
    };
  });

  const totalLast90Expenses = sumMoney(last90Expenses.map((transaction) => transaction.amount));
  const topExpenseCategories = Array.from(
    last90Expenses.reduce((map, transaction) => {
      map.set(transaction.category, (map.get(transaction.category) ?? 0) + transaction.amount);
      return map;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, total]) => ({
      label,
      total: roundFinanceValue(total),
      sharePercent: totalLast90Expenses > 0 ? roundFinanceValue((total / totalLast90Expenses) * 100) : 0,
    }));

  const topExpenseEntities = Array.from(
    last90Expenses.reduce((map, transaction) => {
      const current = map.get(transaction.entityId) ?? 0;
      map.set(transaction.entityId, current + transaction.amount);
      return map;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([entityId, total]) => ({
      entityId,
      label: entityMap.get(entityId) ?? entityId,
      total: roundFinanceValue(total),
      sharePercent: totalLast90Expenses > 0 ? roundFinanceValue((total / totalLast90Expenses) * 100) : 0,
    }));

  const dueSoon = upcomingExpenses.filter((expense) => {
    if (expense.paid) return false;
    const dueMs = parseTimestamp(expense.dueDate);
    return dueMs >= now - 86_400_000 && dueMs <= now + 14 * 86_400_000;
  });

  const last30Income = sumMoney(
    last30Transactions.filter((transaction) => transaction.type === "INCOME").map((transaction) => transaction.amount),
  );
  const last30Expenses = sumMoney(
    last30Transactions.filter((transaction) => transaction.type === "EXPENSE").map((transaction) => transaction.amount),
  );
  const last30NetCashflow = last30Income - last30Expenses;

  return {
    last30Income: roundFinanceValue(last30Income),
    last30Expenses: roundFinanceValue(last30Expenses),
    last30NetCashflow: roundFinanceValue(last30NetCashflow),
    savingsRatePercent:
      last30Income > 0 ? roundFinanceValue(Math.max(0, (last30NetCashflow / last30Income) * 100)) : 0,
    dueSoonTotal: roundFinanceValue(sumMoney(dueSoon.map((expense) => expense.amount))),
    dueSoonCount: dueSoon.length,
    liabilityRatioPercent: totalAssets > 0 ? roundFinanceValue((totalLiabilities / totalAssets) * 100) : 0,
    currentMonthExpenses: roundFinanceValue(currentMonthExpenses),
    previousMonthExpenses: roundFinanceValue(previousMonthExpenses),
    scenarios,
    weeklyTrend,
    monthlyTrend,
    topExpenseCategories,
    topExpenseEntities,
  };
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
  burnBasis: BurnBasis;
  burnLabel: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  monthlyBurn: number;
  monthsOfFreedom: number;
}

export interface FinancePulse {
  last30Income: number;
  last30Expenses: number;
  last30NetCashflow: number;
  savingsRatePercent: number;
  dueSoonTotal: number;
  dueSoonCount: number;
  liabilityRatioPercent: number;
  currentMonthExpenses: number;
  previousMonthExpenses: number;
  scenarios: BurnScenario[];
  weeklyTrend: FinanceTrendPoint[];
  monthlyTrend: FinanceTrendPoint[];
  topExpenseCategories: FinanceBreakdownItem[];
  topExpenseEntities: FinanceBreakdownItem[];
}

export interface HomeDashboardData {
  generatedAt: string;
  topProjects: Project[];
  nextTasks: Task[];
  runway: RunwayResult;
  financePulse: FinancePulse;
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

export interface WeeklyReviewDraftRequest {
  reviewDate: string;
  taskWindowDays: number;
}

export interface WeeklyReviewDraftResponse {
  reviewDate: string;
  wins: string[];
  stuck: string[];
  topThreeNextWeek: string[];
  runwayCommentary: string;
  generatedAt: string;
}

export interface UpcomingExpenseReminder {
  expenseId: Id;
  bill: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
  severity: "OVERDUE" | "DUE_SOON" | "UPCOMING";
}

export interface UpcomingExpenseReminderResponse {
  generatedAt: string;
  windowDays: number;
  overdueCount: number;
  dueSoonCount: number;
  reminders: UpcomingExpenseReminder[];
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
  title?: string;
  projectId?: Id;
  status?: TaskStatus;
  dueDate?: string;
  energy?: Task["energy"];
  context?: Task["context"];
  recurring?: boolean;
  notes?: string;
}

export interface CreateProjectInput {
  name: string;
  entityId: Id;
  status?: ProjectStatus;
  nextMilestone?: string;
  deadline?: string;
  skillsUsedCourseIds?: Id[];
  postMortem?: string;
}

export interface UpdateProjectInput {
  name?: string;
  entityId?: Id;
  status?: ProjectStatus;
  nextMilestone?: string;
  deadline?: string;
  skillsUsedCourseIds?: Id[];
  postMortem?: string;
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

export interface CreatePathwayInput {
  title: string;
  status?: Pathway["status"];
  progressPercent?: number;
}

export interface UpdatePathwayInput {
  title?: string;
  status?: Pathway["status"];
  progressPercent?: number;
}

export interface CreateCourseCertInput {
  title: string;
  pathwayId: Id;
  status?: CourseStatus;
  targetDate?: string;
  estimatedHours?: number;
  completedHours?: number;
  proofUrls?: string[];
  appliedProjectIds?: Id[];
  appliedProgressPercent?: number;
}

export interface UpdateCourseCertInput {
  title?: string;
  pathwayId?: Id;
  status?: CourseStatus;
  targetDate?: string;
  estimatedHours?: number;
  completedHours?: number;
  proofUrls?: string[];
  appliedProjectIds?: Id[];
  appliedProgressPercent?: number;
}

export interface CreateAccountInput {
  service: string;
  entityId: Id;
  loginIdentifier?: string;
  role?: AccountRef["role"];
  twoFactorEnabled?: boolean;
  vaultItemUrl?: string;
  vaultItemId?: string;
  lastRotated?: string;
  notes?: string;
}

export interface UpdateAccountInput {
  service?: string;
  entityId?: Id;
  loginIdentifier?: string;
  role?: AccountRef["role"];
  twoFactorEnabled?: boolean;
  vaultItemUrl?: string;
  vaultItemId?: string;
  lastRotated?: string;
  notes?: string;
}

export interface CreateTransactionInput {
  date: string;
  amount: number;
  type: Transaction["type"];
  entityId: Id;
  category: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  date?: string;
  amount?: number;
  type?: Transaction["type"];
  entityId?: Id;
  category?: string;
  notes?: string;
}

export interface CreateUpcomingExpenseInput {
  bill: string;
  amount: number;
  dueDate: string;
  frequency: UpcomingExpense["frequency"];
  entityId: Id;
  paid?: boolean;
}

export interface UpdateUpcomingExpenseInput {
  bill?: string;
  amount?: number;
  dueDate?: string;
  frequency?: UpcomingExpense["frequency"];
  entityId?: Id;
  paid?: boolean;
}

export interface CreateMetricInput {
  metricName: string;
  category: MetricPoint["category"];
  value: number;
  unit: MetricPoint["unit"];
  date: string;
  entityId?: Id;
  projectId?: Id;
}

export interface CreateReviewNoteInput {
  reviewDate: string;
  wins: string[];
  stuck: string[];
  topThreeNextWeek: string[];
  runwayCommentary: string;
}

export interface UpdateMetricInput {
  metricName?: string;
  category?: MetricPoint["category"];
  value?: number;
  unit?: MetricPoint["unit"];
  date?: string;
  entityId?: Id;
  projectId?: Id;
}

export interface CreateHealthLogInput {
  date: string;
  entityId: Id;
  steps: number;
  sleepHours: number;
  restingHeartRate: number;
  hydrationLiters: number;
  recoveryScore: number;
  weightKg?: number;
}

export interface UpdateHealthLogInput {
  date?: string;
  entityId?: Id;
  steps?: number;
  sleepHours?: number;
  restingHeartRate?: number;
  hydrationLiters?: number;
  recoveryScore?: number;
  weightKg?: number;
}

export interface CreateWorkoutInput {
  date: string;
  entityId: Id;
  sessionType: WorkoutSession["sessionType"];
  intensity: WorkoutSession["intensity"];
  durationMinutes: number;
  volumeLoadKg?: number;
  notes?: string;
}

export interface UpdateWorkoutInput {
  date?: string;
  entityId?: Id;
  sessionType?: WorkoutSession["sessionType"];
  intensity?: WorkoutSession["intensity"];
  durationMinutes?: number;
  volumeLoadKg?: number;
  notes?: string;
}

export interface CreateFamilyEventInput {
  title: string;
  date: string;
  category: FamilyEvent["category"];
  importance: FamilyEvent["importance"];
  entityId?: Id;
  notes?: string;
}

export interface UpdateFamilyEventInput {
  title?: string;
  date?: string;
  category?: FamilyEvent["category"];
  importance?: FamilyEvent["importance"];
  entityId?: Id;
  notes?: string;
}

export interface CreateRelationshipCheckinInput {
  person: string;
  relationType: RelationshipCheckin["relationType"];
  lastMeaningfulContact: string;
  targetCadenceDays: number;
  entityId?: Id;
  notes?: string;
}

export interface UpdateRelationshipCheckinInput {
  person?: string;
  relationType?: RelationshipCheckin["relationType"];
  lastMeaningfulContact?: string;
  targetCadenceDays?: number;
  entityId?: Id;
  notes?: string;
}

export interface CreateTimeOffPlanInput {
  title: string;
  status: TimeOffPlan["status"];
  targetDate?: string;
  estimatedCostAud: number;
  priority: TimeOffPlan["priority"];
  entityId?: Id;
  notes?: string;
}

export interface UpdateTimeOffPlanInput {
  title?: string;
  status?: TimeOffPlan["status"];
  targetDate?: string;
  estimatedCostAud?: number;
  priority?: TimeOffPlan["priority"];
  entityId?: Id;
  notes?: string;
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
