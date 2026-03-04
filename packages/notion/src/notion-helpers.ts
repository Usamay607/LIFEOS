import type {
  AccountRef,
  Area,
  FamilyEvent,
  HealthDailyLog,
  Entity,
  JournalEntry,
  Pathway,
  Project,
  ReviewNote,
  Task,
  Transaction,
  UpcomingExpense,
  MetricPoint,
  CourseCert,
  RelationshipCheckin,
  TimeOffPlan,
  WorkoutSession,
} from "@los/types";

type NotionPage = {
  id: string;
  properties: Record<string, any>;
};

const fromTitle = (page: NotionPage, key: string): string =>
  page.properties[key]?.title?.[0]?.plain_text ?? "";

const fromRichText = (page: NotionPage, key: string): string =>
  page.properties[key]?.rich_text?.map((entry: any) => entry.plain_text).join("") ?? "";

const fromSelect = (page: NotionPage, key: string): string => page.properties[key]?.select?.name ?? "";

const fromCheckbox = (page: NotionPage, key: string): boolean => Boolean(page.properties[key]?.checkbox);

const fromNumber = (page: NotionPage, key: string): number => Number(page.properties[key]?.number ?? 0);

const fromDate = (page: NotionPage, key: string): string | undefined => page.properties[key]?.date?.start;
const fromMultiSelect = (page: NotionPage, key: string): string[] =>
  page.properties[key]?.multi_select?.map((entry: { name: string }) => entry.name) ?? [];

const fromRelationIds = (page: NotionPage, key: string): string[] =>
  page.properties[key]?.relation?.map((entry: { id: string }) => entry.id) ?? [];

export function mapNotionPageToEntity(page: NotionPage): Entity {
  return {
    id: page.id,
    name: fromTitle(page, "name"),
    areaId: fromRelationIds(page, "area")[0] ?? "",
    type: (fromSelect(page, "type") as Entity["type"]) || "ADMIN",
    status: (fromSelect(page, "status") as Entity["status"]) || "ACTIVE",
    priority: (Math.max(1, Math.min(5, fromNumber(page, "priority"))) as Entity["priority"]) || 3,
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToArea(page: NotionPage): Area {
  return {
    id: page.id,
    name: fromTitle(page, "name"),
    color: (fromSelect(page, "color") as Area["color"]) || "SLATE",
    active: fromCheckbox(page, "active"),
  };
}

export function mapNotionPageToProject(page: NotionPage): Project {
  return {
    id: page.id,
    name: fromTitle(page, "name"),
    entityId: fromRelationIds(page, "entity")[0] ?? "",
    status: (fromSelect(page, "status") as Project["status"]) || "ACTIVE",
    nextMilestone: fromRichText(page, "next_milestone") || undefined,
    deadline: fromDate(page, "deadline"),
    skillsUsedCourseIds: fromRelationIds(page, "skills_used"),
    postMortem: fromRichText(page, "post_mortem") || undefined,
  };
}

export function mapNotionPageToTask(page: NotionPage): Task {
  return {
    id: page.id,
    title: fromTitle(page, "title"),
    projectId: fromRelationIds(page, "project")[0] ?? "",
    status: (fromSelect(page, "status") as Task["status"]) || "NEXT",
    dueDate: fromDate(page, "due_date"),
    energy: (fromSelect(page, "energy") as Task["energy"]) || "MEDIUM",
    context: (fromSelect(page, "context") as Task["context"]) || "LAPTOP",
    recurring: fromCheckbox(page, "recurring"),
    notes: fromRichText(page, "notes") || undefined,
    createdAt: fromDate(page, "created_at") ?? new Date().toISOString(),
  };
}

export function mapNotionPageToTransaction(page: NotionPage): Transaction {
  return {
    id: page.id,
    date: fromDate(page, "date") ?? new Date().toISOString(),
    amount: fromNumber(page, "amount"),
    type: (fromSelect(page, "type") as Transaction["type"]) || "EXPENSE",
    entityId: fromRelationIds(page, "entity")[0] ?? "",
    category: fromSelect(page, "category") || "Other",
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToUpcomingExpense(page: NotionPage): UpcomingExpense {
  return {
    id: page.id,
    bill: fromTitle(page, "bill"),
    amount: fromNumber(page, "amount"),
    dueDate: fromDate(page, "due_date") ?? new Date().toISOString(),
    frequency: (fromSelect(page, "frequency") as UpcomingExpense["frequency"]) || "MONTHLY",
    entityId: fromRelationIds(page, "entity")[0] ?? "",
    paid: fromCheckbox(page, "paid"),
  };
}

export function mapNotionPageToMetric(page: NotionPage): MetricPoint {
  return {
    id: page.id,
    metricName: fromTitle(page, "metric_name"),
    category: (fromSelect(page, "category") as MetricPoint["category"]) || "FINANCE",
    value: fromNumber(page, "value"),
    unit: (fromSelect(page, "unit") as MetricPoint["unit"]) || "COUNT",
    date: fromDate(page, "date") ?? new Date().toISOString(),
    entityId: fromRelationIds(page, "entity")[0] || undefined,
    projectId: fromRelationIds(page, "project")[0] || undefined,
  };
}

export function mapNotionPageToCourse(page: NotionPage): CourseCert {
  return {
    id: page.id,
    title: fromTitle(page, "course_cert"),
    pathwayId: fromRelationIds(page, "pathway")[0] ?? "",
    status: (fromSelect(page, "status") as CourseCert["status"]) || "NOT_STARTED",
    targetDate: fromDate(page, "target_date"),
    estimatedHours: fromNumber(page, "estimated_hours") || undefined,
    completedHours: fromNumber(page, "completed_hours") || undefined,
    proofUrls:
      page.properties.proof?.files?.map((file: any) => file.file?.url ?? file.external?.url).filter(Boolean) ?? [],
    appliedProjectIds: fromRelationIds(page, "applied_projects"),
    appliedProgressPercent: fromNumber(page, "applied_progress_percent"),
  };
}

export function mapNotionPageToPathway(page: NotionPage): Pathway {
  return {
    id: page.id,
    title: fromTitle(page, "title"),
    status: (fromSelect(page, "status") as Pathway["status"]) || "LATER",
    progressPercent: fromNumber(page, "progress_percent"),
  };
}

export function mapNotionPageToAccount(page: NotionPage): AccountRef {
  return {
    id: page.id,
    service: fromTitle(page, "service"),
    entityId: fromRelationIds(page, "entity")[0] ?? "",
    loginIdentifier: fromRichText(page, "login_identifier"),
    role: (fromSelect(page, "role") as AccountRef["role"]) || "USER",
    twoFactorEnabled: fromCheckbox(page, "2fa_enabled"),
    vaultItemUrl: fromRichText(page, "vault_item_url"),
    vaultItemId: fromRichText(page, "vault_item_id") || undefined,
    lastRotated: fromDate(page, "last_rotated"),
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToHealthLog(page: NotionPage): HealthDailyLog {
  return {
    id: page.id,
    date: fromDate(page, "date") ?? new Date().toISOString(),
    entityId: fromRelationIds(page, "entity")[0] ?? "",
    steps: fromNumber(page, "steps"),
    sleepHours: fromNumber(page, "sleep_hours"),
    restingHeartRate: fromNumber(page, "resting_hr"),
    hydrationLiters: fromNumber(page, "hydration_liters"),
    recoveryScore: fromNumber(page, "recovery_score"),
    weightKg: fromNumber(page, "weight_kg") || undefined,
  };
}

export function mapNotionPageToWorkout(page: NotionPage): WorkoutSession {
  return {
    id: page.id,
    date: fromDate(page, "date") ?? new Date().toISOString(),
    entityId: fromRelationIds(page, "entity")[0] ?? "",
    sessionType: (fromSelect(page, "session_type") as WorkoutSession["sessionType"]) || "STRENGTH",
    intensity: (fromSelect(page, "intensity") as WorkoutSession["intensity"]) || "MEDIUM",
    durationMinutes: fromNumber(page, "duration_minutes"),
    volumeLoadKg: fromNumber(page, "volume_load_kg") || undefined,
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToFamilyEvent(page: NotionPage): FamilyEvent {
  return {
    id: page.id,
    title: fromTitle(page, "title"),
    date: fromDate(page, "date") ?? new Date().toISOString(),
    category: (fromSelect(page, "category") as FamilyEvent["category"]) || "FAMILY",
    importance: (fromSelect(page, "importance") as FamilyEvent["importance"]) || "MEDIUM",
    entityId: fromRelationIds(page, "entity")[0] || undefined,
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToRelationshipCheckin(page: NotionPage): RelationshipCheckin {
  return {
    id: page.id,
    person: fromTitle(page, "person"),
    relationType: (fromSelect(page, "relation_type") as RelationshipCheckin["relationType"]) || "FAMILY",
    lastMeaningfulContact: fromDate(page, "last_meaningful_contact") ?? new Date().toISOString(),
    targetCadenceDays: fromNumber(page, "target_cadence_days"),
    entityId: fromRelationIds(page, "entity")[0] || undefined,
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToTimeOffPlan(page: NotionPage): TimeOffPlan {
  return {
    id: page.id,
    title: fromTitle(page, "title"),
    status: (fromSelect(page, "status") as TimeOffPlan["status"]) || "PRE_SABBATICAL",
    targetDate: fromDate(page, "target_date"),
    estimatedCostAud: fromNumber(page, "estimated_cost_aud"),
    priority: (fromSelect(page, "priority") as TimeOffPlan["priority"]) || "MEDIUM",
    entityId: fromRelationIds(page, "entity")[0] || undefined,
    notes: fromRichText(page, "notes") || undefined,
  };
}

export function mapNotionPageToJournalEntry(page: NotionPage): JournalEntry {
  return {
    id: page.id,
    date: fromDate(page, "date") ?? new Date().toISOString(),
    title: fromTitle(page, "title"),
    entry: fromRichText(page, "entry"),
    mood: (fromSelect(page, "mood") as JournalEntry["mood"]) || "NEUTRAL",
    tags: fromMultiSelect(page, "tags"),
    entityId: fromRelationIds(page, "entity")[0] || undefined,
    energyScore: fromNumber(page, "energy_score") || undefined,
    focusScore: fromNumber(page, "focus_score") || undefined,
  };
}

export function mapNotionPageToReview(page: NotionPage): ReviewNote {
  const parseList = (value: string): string[] =>
    value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    id: page.id,
    reviewDate: fromDate(page, "review_date") ?? new Date().toISOString(),
    wins: parseList(fromRichText(page, "wins")),
    stuck: parseList(fromRichText(page, "stuck")),
    topThreeNextWeek: parseList(fromRichText(page, "top_three_next_week")),
    runwayCommentary: fromRichText(page, "runway_commentary"),
  };
}

export function textProperty(value: string) {
  return { rich_text: [{ type: "text", text: { content: value } }] };
}

export function titleProperty(value: string) {
  return { title: [{ type: "text", text: { content: value } }] };
}
