"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  deriveFinancePulse,
  deriveFinanceMetricSnapshot,
  FINANCE_METRIC_NAMES,
  getFinanceMetricKey,
} from "@los/types";
import type {
  AccountRef,
  CourseCert,
  Entity,
  FamilyEvent,
  HealthDailyLog,
  MetricPoint,
  Pathway,
  Project,
  RelationshipCheckin,
  TimeOffPlan,
  Transaction,
  UpcomingExpense,
  WorkoutSession,
} from "@los/types";
import { Button } from "@/components/ui/button";

type HealthViewMode = "TODAY_YESTERDAY" | "SELECTED_DAY";
type DateViewMode = "ALL" | "SELECTED_DAY";
type StudioSection = "PROJECTS" | "FINANCE" | "LEARNING" | "ACCOUNTS" | "HEALTH" | "FAMILY" | "TRANSITION";

interface DataStudioWorkspaceProps {
  entities: Entity[];
  initialProjects: Project[];
  initialPathways: Pathway[];
  initialCourses: CourseCert[];
  initialAccounts: AccountRef[];
  initialMetrics: MetricPoint[];
  initialTransactions: Transaction[];
  initialUpcomingExpenses: UpcomingExpense[];
  initialHealthLogs: HealthDailyLog[];
  initialWorkouts: WorkoutSession[];
  initialFamilyEvents: FamilyEvent[];
  initialRelationshipCheckins: RelationshipCheckin[];
  initialTimeOffPlans: TimeOffPlan[];
}

const PROJECT_STATUSES: Array<Project["status"]> = ["ACTIVE", "ON_HOLD", "CEASED"];
const PATHWAY_STATUSES: Array<Pathway["status"]> = ["ACTIVE", "LATER", "COMPLETED"];
const COURSE_STATUSES: Array<CourseCert["status"]> = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
const ACCOUNT_ROLES: Array<AccountRef["role"]> = ["OWNER", "ADMIN", "USER"];
const METRIC_CATEGORIES: Array<MetricPoint["category"]> = ["FINANCE", "HEALTH", "LEARNING", "WORK", "LIFE"];
const METRIC_UNITS: Array<MetricPoint["unit"]> = ["AUD", "KG", "PERCENT", "HOURS", "COUNT"];
const TXN_TYPES: Array<Transaction["type"]> = ["INCOME", "EXPENSE"];
const EXPENSE_FREQUENCIES: Array<UpcomingExpense["frequency"]> = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_OFF"];
const WORKOUT_TYPES: Array<WorkoutSession["sessionType"]> = ["STRENGTH", "CARDIO", "MOBILITY", "SPORT", "RECOVERY"];
const WORKOUT_INTENSITIES: Array<WorkoutSession["intensity"]> = ["LOW", "MEDIUM", "HIGH"];
const FAMILY_CATEGORIES: Array<FamilyEvent["category"]> = ["BIRTHDAY", "ANNIVERSARY", "SOCIAL", "FAMILY", "ADMIN"];
const FAMILY_IMPORTANCE: Array<FamilyEvent["importance"]> = ["LOW", "MEDIUM", "HIGH"];
const RELATION_TYPES: Array<RelationshipCheckin["relationType"]> = ["FAMILY", "FRIEND", "MENTOR", "PARTNER"];
const TIMEOFF_STATUSES: Array<TimeOffPlan["status"]> = ["PRE_SABBATICAL", "READY", "ACTIVE_TIME_OFF", "COMPLETED"];
const TIMEOFF_PRIORITIES: Array<TimeOffPlan["priority"]> = ["LOW", "MEDIUM", "HIGH"];
const STUDIO_SECTIONS: Array<{ key: StudioSection; label: string }> = [
  { key: "PROJECTS", label: "Projects" },
  { key: "FINANCE", label: "Finance" },
  { key: "LEARNING", label: "Learning" },
  { key: "ACCOUNTS", label: "Accounts" },
  { key: "HEALTH", label: "Health" },
  { key: "FAMILY", label: "Family" },
  { key: "TRANSITION", label: "Transition" },
];

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function localDateKey(deltaDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + deltaDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function latestFinanceStatementDate(metrics: MetricPoint[]): string | null {
  const datedMetrics = metrics
    .filter((metric) => getFinanceMetricKey(metric.metricName) !== null)
    .sort((left, right) => right.date.localeCompare(left.date));

  return datedMetrics[0] ? toDateInput(datedMetrics[0].date) : null;
}

function getFinanceMetricForDate(metrics: MetricPoint[], key: keyof typeof FINANCE_METRIC_NAMES, date: string) {
  return metrics.find((metric) => getFinanceMetricKey(metric.metricName) === key && toDateInput(metric.date) === date);
}

function DataStudioPanel({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            {summary ? <p className="mt-1 text-xs text-white/55">{summary}</p> : null}
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Open
          </span>
        </div>
      </summary>
      <div className="mt-4 space-y-3">{children}</div>
    </details>
  );
}

export function DataStudioWorkspace({
  entities,
  initialProjects,
  initialPathways,
  initialCourses,
  initialAccounts,
  initialMetrics,
  initialTransactions,
  initialUpcomingExpenses,
  initialHealthLogs,
  initialWorkouts,
  initialFamilyEvents,
  initialRelationshipCheckins,
  initialTimeOffPlans,
}: DataStudioWorkspaceProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [pathways, setPathways] = useState<Pathway[]>(initialPathways);
  const [courses, setCourses] = useState<CourseCert[]>(initialCourses);
  const [accounts, setAccounts] = useState<AccountRef[]>(initialAccounts);
  const [metrics, setMetrics] = useState<MetricPoint[]>(initialMetrics);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [upcomingExpenses, setUpcomingExpenses] = useState<UpcomingExpense[]>(initialUpcomingExpenses);
  const [healthLogs, setHealthLogs] = useState<HealthDailyLog[]>(initialHealthLogs);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(initialWorkouts);
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>(initialFamilyEvents);
  const [relationshipCheckins, setRelationshipCheckins] = useState<RelationshipCheckin[]>(initialRelationshipCheckins);
  const [timeOffPlans, setTimeOffPlans] = useState<TimeOffPlan[]>(initialTimeOffPlans);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [activeSection, setActiveSection] = useState<StudioSection>("HEALTH");
  const [healthViewMode, setHealthViewMode] = useState<HealthViewMode>("TODAY_YESTERDAY");
  const [healthFocusDate, setHealthFocusDate] = useState(() => localDateKey(0));
  const [projectsViewMode, setProjectsViewMode] = useState<DateViewMode>("ALL");
  const [projectsFocusDate, setProjectsFocusDate] = useState(() => localDateKey(0));
  const [financeViewMode, setFinanceViewMode] = useState<DateViewMode>("ALL");
  const [financeFocusDate, setFinanceFocusDate] = useState(() => latestFinanceStatementDate(initialMetrics) ?? localDateKey(0));
  const [learningViewMode, setLearningViewMode] = useState<DateViewMode>("ALL");
  const [learningFocusDate, setLearningFocusDate] = useState(() => localDateKey(0));
  const [accountsViewMode, setAccountsViewMode] = useState<DateViewMode>("ALL");
  const [accountsFocusDate, setAccountsFocusDate] = useState(() => localDateKey(0));
  const [familyViewMode, setFamilyViewMode] = useState<DateViewMode>("ALL");
  const [familyFocusDate, setFamilyFocusDate] = useState(() => localDateKey(0));
  const [transitionViewMode, setTransitionViewMode] = useState<DateViewMode>("ALL");
  const [transitionFocusDate, setTransitionFocusDate] = useState(() => localDateKey(0));

  const entityOptions = useMemo(() => entities.map((entity) => ({ id: entity.id, name: entity.name })), [entities]);
  const defaultFinanceEntityId = useMemo(
    () => entities.find((entity) => entity.id === "ent_personal")?.id ?? entityOptions[0]?.id ?? "",
    [entities, entityOptions],
  );
  const todayDate = useMemo(() => localDateKey(0), []);
  const yesterdayDate = useMemo(() => localDateKey(-1), []);
  const activeHealthDate = healthViewMode === "SELECTED_DAY" ? healthFocusDate || todayDate : todayDate;
  const healthDateFilter = useMemo(
    () => (healthViewMode === "SELECTED_DAY" ? [activeHealthDate] : [todayDate, yesterdayDate]),
    [activeHealthDate, healthViewMode, todayDate, yesterdayDate],
  );
  const visibleHealthLogs = useMemo(
    () =>
      healthLogs
        .filter((item) => healthDateFilter.includes(toDateInput(item.date)))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [healthDateFilter, healthLogs],
  );
  const visibleWorkouts = useMemo(
    () =>
      workouts
        .filter((item) => healthDateFilter.includes(toDateInput(item.date)))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [healthDateFilter, workouts],
  );
  const visibleProjects = useMemo(
    () =>
      projectsViewMode === "SELECTED_DAY"
        ? projects.filter((item) => toDateInput(item.deadline) === projectsFocusDate)
        : projects,
    [projects, projectsFocusDate, projectsViewMode],
  );
  const customFinanceMetrics = useMemo(
    () => metrics.filter((item) => getFinanceMetricKey(item.metricName) === null),
    [metrics],
  );
  const visibleMetrics = useMemo(
    () =>
      financeViewMode === "SELECTED_DAY"
        ? customFinanceMetrics.filter((item) => toDateInput(item.date) === financeFocusDate)
        : customFinanceMetrics.slice(0, 10),
    [customFinanceMetrics, financeFocusDate, financeViewMode],
  );
  const visibleTransactions = useMemo(
    () =>
      financeViewMode === "SELECTED_DAY"
        ? transactions.filter((item) => toDateInput(item.date) === financeFocusDate)
        : transactions.slice(0, 12),
    [financeFocusDate, financeViewMode, transactions],
  );
  const visibleUpcomingExpenses = useMemo(
    () =>
      financeViewMode === "SELECTED_DAY"
        ? upcomingExpenses.filter((item) => toDateInput(item.dueDate) === financeFocusDate)
        : upcomingExpenses.slice(0, 12),
    [financeFocusDate, financeViewMode, upcomingExpenses],
  );
  const visibleCourses = useMemo(
    () =>
      learningViewMode === "SELECTED_DAY"
        ? courses.filter((item) => toDateInput(item.targetDate) === learningFocusDate)
        : courses.slice(0, 12),
    [courses, learningFocusDate, learningViewMode],
  );
  const visibleAccounts = useMemo(
    () =>
      accountsViewMode === "SELECTED_DAY"
        ? accounts.filter((item) => toDateInput(item.lastRotated) === accountsFocusDate)
        : accounts.slice(0, 12),
    [accounts, accountsFocusDate, accountsViewMode],
  );
  const visibleFamilyEvents = useMemo(
    () =>
      familyViewMode === "SELECTED_DAY"
        ? familyEvents.filter((item) => toDateInput(item.date) === familyFocusDate)
        : familyEvents.slice(0, 10),
    [familyEvents, familyFocusDate, familyViewMode],
  );
  const visibleRelationshipCheckins = useMemo(
    () =>
      familyViewMode === "SELECTED_DAY"
        ? relationshipCheckins.filter((item) => toDateInput(item.lastMeaningfulContact) === familyFocusDate)
        : relationshipCheckins.slice(0, 10),
    [familyFocusDate, familyViewMode, relationshipCheckins],
  );
  const visibleTimeOffPlans = useMemo(
    () =>
      transitionViewMode === "SELECTED_DAY"
        ? timeOffPlans.filter((item) => toDateInput(item.targetDate) === transitionFocusDate)
        : timeOffPlans.slice(0, 12),
    [timeOffPlans, transitionFocusDate, transitionViewMode],
  );

  const [newProject, setNewProject] = useState({
    name: "",
    entityId: entityOptions[0]?.id ?? "",
    status: "ACTIVE" as Project["status"],
    nextMilestone: "",
    deadline: "",
  });

  const [newPathway, setNewPathway] = useState({
    title: "",
    status: "ACTIVE" as Pathway["status"],
    progressPercent: "0",
  });

  const [newCourse, setNewCourse] = useState({
    title: "",
    pathwayId: pathways[0]?.id ?? "",
    status: "NOT_STARTED" as CourseCert["status"],
    targetDate: "",
    estimatedHours: "",
    completedHours: "",
    appliedProgressPercent: "0",
  });

  const [newAccount, setNewAccount] = useState({
    service: "",
    entityId: entityOptions[0]?.id ?? "",
    loginIdentifier: "",
    role: "USER" as AccountRef["role"],
    twoFactorEnabled: false,
    vaultItemUrl: "",
    lastRotated: "",
  });

  const [newMetric, setNewMetric] = useState({
    metricName: "",
    category: "FINANCE" as MetricPoint["category"],
    unit: "AUD" as MetricPoint["unit"],
    value: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [balanceSheetOverrides, setBalanceSheetOverrides] = useState<
    Record<string, { totalAssets: string; totalLiabilities: string; liquidAssets: string }>
  >({});

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    type: "EXPENSE" as Transaction["type"],
    entityId: entityOptions[0]?.id ?? "",
    category: "",
  });

  const [newUpcomingExpense, setNewUpcomingExpense] = useState({
    bill: "",
    amount: "",
    dueDate: new Date().toISOString().slice(0, 10),
    frequency: "MONTHLY" as UpcomingExpense["frequency"],
    entityId: entityOptions[0]?.id ?? "",
    paid: false,
  });

  const [newHealthLog, setNewHealthLog] = useState({
    entityId: entityOptions[0]?.id ?? "",
    steps: "",
    sleepHours: "",
    restingHeartRate: "",
    hydrationLiters: "",
    recoveryScore: "",
    weightKg: "",
  });

  const [newWorkout, setNewWorkout] = useState({
    entityId: entityOptions[0]?.id ?? "",
    sessionType: "STRENGTH" as WorkoutSession["sessionType"],
    intensity: "MEDIUM" as WorkoutSession["intensity"],
    durationMinutes: "",
    volumeLoadKg: "",
    notes: "",
  });

  const [newFamilyEvent, setNewFamilyEvent] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    category: "FAMILY" as FamilyEvent["category"],
    importance: "MEDIUM" as FamilyEvent["importance"],
    entityId: entityOptions[0]?.id ?? "",
    notes: "",
  });

  const [newCheckin, setNewCheckin] = useState({
    person: "",
    relationType: "FAMILY" as RelationshipCheckin["relationType"],
    lastMeaningfulContact: new Date().toISOString().slice(0, 10),
    targetCadenceDays: "7",
    entityId: entityOptions[0]?.id ?? "",
    notes: "",
  });

  const [newTimeOffPlan, setNewTimeOffPlan] = useState({
    title: "",
    status: "PRE_SABBATICAL" as TimeOffPlan["status"],
    targetDate: "",
    estimatedCostAud: "",
    priority: "MEDIUM" as TimeOffPlan["priority"],
    entityId: entityOptions[0]?.id ?? "",
    notes: "",
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const balanceSheetSnapshot = useMemo(
    () => deriveFinanceMetricSnapshot(metrics.filter((item) => toDateInput(item.date) === financeFocusDate)),
    [financeFocusDate, metrics],
  );
  const latestFinanceSnapshot = useMemo(() => deriveFinanceMetricSnapshot(metrics), [metrics]);
  const financeInsights = useMemo(
    () =>
      deriveFinancePulse({
        transactions,
        upcomingExpenses,
        liquidAssets: latestFinanceSnapshot.liquidAssets,
        totalAssets: latestFinanceSnapshot.totalAssets,
        totalLiabilities: latestFinanceSnapshot.totalLiabilities,
        entities,
      }),
    [entities, latestFinanceSnapshot.liquidAssets, latestFinanceSnapshot.totalAssets, latestFinanceSnapshot.totalLiabilities, transactions, upcomingExpenses],
  );
  const balanceSheetDraft = useMemo(() => {
    const override = balanceSheetOverrides[financeFocusDate];
    if (override) {
      return override;
    }

    const totalAssetsMetric = getFinanceMetricForDate(metrics, "totalAssets", financeFocusDate);
    const totalLiabilitiesMetric = getFinanceMetricForDate(metrics, "totalLiabilities", financeFocusDate);
    const liquidAssetsMetric = getFinanceMetricForDate(metrics, "liquidAssets", financeFocusDate);

    return {
      totalAssets: totalAssetsMetric ? String(totalAssetsMetric.value) : "",
      totalLiabilities: totalLiabilitiesMetric ? String(totalLiabilitiesMetric.value) : "",
      liquidAssets: liquidAssetsMetric ? String(liquidAssetsMetric.value) : "",
    };
  }, [balanceSheetOverrides, financeFocusDate, metrics]);
  const draftNetWorth = useMemo(() => {
    const totalAssets = Number(balanceSheetDraft.totalAssets) || 0;
    const totalLiabilities = Number(balanceSheetDraft.totalLiabilities) || 0;
    return totalAssets - totalLiabilities;
  }, [balanceSheetDraft.totalAssets, balanceSheetDraft.totalLiabilities]);

  async function savePatch<T>(url: string, body: unknown, options?: { successMessage?: string | null }): Promise<T | null> {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let message = "Save failed";
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error?.trim()) {
          message = payload.error.trim();
        }
      } catch {
        // Ignore parse errors for non-JSON responses.
      }
      setToast({ message, tone: "error" });
      return null;
    }

    const payload = (await response.json()) as T;
    const successMessage = options?.successMessage ?? "Saved to Notion";
    if (successMessage) {
      setToast({ message: successMessage, tone: "success" });
    }
    return payload;
  }

  async function saveCreate<T>(url: string, body: unknown, options?: { successMessage?: string | null }): Promise<T | null> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let message = "Save failed";
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error?.trim()) {
          message = payload.error.trim();
        }
      } catch {
        // Ignore parse errors for non-JSON responses.
      }
      setToast({ message, tone: "error" });
      return null;
    }

    const payload = (await response.json()) as T;
    const successMessage = options?.successMessage ?? "Saved to Notion";
    if (successMessage) {
      setToast({ message: successMessage, tone: "success" });
    }
    return payload;
  }

  async function saveBalanceSheet() {
    const totalAssets = Number(balanceSheetDraft.totalAssets);
    const totalLiabilities = Number(balanceSheetDraft.totalLiabilities);
    const liquidAssets = Number(balanceSheetDraft.liquidAssets);

    if (![totalAssets, totalLiabilities, liquidAssets].every((value) => Number.isFinite(value) && value >= 0)) {
      setToast({ message: "Enter valid asset, liability, and liquid asset amounts.", tone: "error" });
      return;
    }

    const fields: Array<{ key: keyof typeof FINANCE_METRIC_NAMES; value: number }> = [
      { key: "totalAssets", value: totalAssets },
      { key: "totalLiabilities", value: totalLiabilities },
      { key: "liquidAssets", value: liquidAssets },
    ];

    let nextMetrics = metrics;

    for (const field of fields) {
      const existing = getFinanceMetricForDate(nextMetrics, field.key, financeFocusDate);
        const payload = {
          metricName: FINANCE_METRIC_NAMES[field.key],
          category: "FINANCE" as const,
          unit: "AUD" as const,
          value: field.value,
          date: financeFocusDate,
          entityId: existing?.entityId ?? defaultFinanceEntityId ?? undefined,
        };

      const saved = existing
        ? await savePatch<MetricPoint>(`/api/metrics/${existing.id}`, payload, { successMessage: null })
        : await saveCreate<MetricPoint>("/api/metrics", payload, { successMessage: null });

      if (!saved) {
        return;
      }

      nextMetrics = [saved, ...nextMetrics.filter((item) => item.id !== saved.id)].sort((left, right) =>
        right.date.localeCompare(left.date),
      );
    }

    setMetrics(nextMetrics);
    setBalanceSheetOverrides((current) => {
      const next = { ...current };
      delete next[financeFocusDate];
      return next;
    });
    setToast({ message: "Balance sheet saved to Notion", tone: "success" });
  }

  return (
    <div className="los-studio space-y-6">
      {toast ? (
        <div
          className={`fixed right-4 top-20 z-50 rounded-lg border px-3 py-2 text-sm font-medium shadow-lg backdrop-blur ${
            toast.tone === "success"
              ? "border-emerald-300/70 bg-emerald-400/20 text-emerald-100"
              : "border-rose-300/70 bg-rose-400/20 text-rose-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
        {STUDIO_SECTIONS.map((section) => (
          <Button
            key={section.key}
            variant={activeSection === section.key ? "solid" : "ghost"}
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => setActiveSection(section.key)}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {activeSection === "PROJECTS" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Projects</h2>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <Button variant={projectsViewMode === "ALL" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setProjectsViewMode("ALL")}>
            All dates
          </Button>
          <Button variant={projectsViewMode === "SELECTED_DAY" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setProjectsViewMode("SELECTED_DAY")}>
            Select day
          </Button>
          {projectsViewMode === "SELECTED_DAY" ? (
            <input
              type="date"
              className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
              value={projectsFocusDate}
              onChange={(event) => setProjectsFocusDate((event.target as HTMLInputElement).value || todayDate)}
            />
          ) : null}
          <span className="text-xs text-white/65">{visibleProjects.length} project{visibleProjects.length === 1 ? "" : "s"}</span>
        </div>

        <div className="grid gap-2 md:grid-cols-6">
          <input
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            placeholder="Project name"
            value={newProject.name}
            onChange={(event) => setNewProject((current) => ({ ...current, name: (event.target as HTMLInputElement | HTMLSelectElement).value }))}
          />
          <select
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            value={newProject.entityId}
            onChange={(event) => setNewProject((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}
          >
            {entityOptions.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            value={newProject.status}
            onChange={(event) => setNewProject((current) => ({ ...current, status: (event.target as HTMLInputElement | HTMLSelectElement).value as Project["status"] }))}
          >
            {PROJECT_STATUSES.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusValue}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            placeholder="Next milestone"
            value={newProject.nextMilestone}
            onChange={(event) => setNewProject((current) => ({ ...current, nextMilestone: (event.target as HTMLInputElement | HTMLSelectElement).value }))}
          />
          <input
            type="date"
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            value={newProject.deadline}
            onChange={(event) => setNewProject((current) => ({ ...current, deadline: (event.target as HTMLInputElement | HTMLSelectElement).value }))}
          />
          <Button
            onClick={async () => {
              const created = await saveCreate<Project>("/api/projects", {
                name: newProject.name,
                entityId: newProject.entityId,
                status: newProject.status,
                nextMilestone: newProject.nextMilestone,
                deadline: newProject.deadline || undefined,
              });
              if (!created) return;
              setProjects((current) => [created, ...current]);
              setNewProject((current) => ({ ...current, name: "", nextMilestone: "", deadline: "" }));
            }}
          >
            Add Project
          </Button>
        </div>

        <div className="space-y-2">
          {visibleProjects.length > 0 ? (
            visibleProjects.map((project) => (
            <article key={project.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-6">
              <input
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={project.name}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, name: (event.target as HTMLInputElement | HTMLSelectElement).value } : item)),
                  )
                }
              />
              <select
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={project.entityId}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item)),
                  )
                }
              >
                {entityOptions.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={project.status}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, status: (event.target as HTMLInputElement | HTMLSelectElement).value as Project["status"] } : item)),
                  )
                }
              >
                {PROJECT_STATUSES.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue}
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={project.nextMilestone ?? ""}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, nextMilestone: (event.target as HTMLInputElement | HTMLSelectElement).value } : item)),
                  )
                }
              />
              <input
                type="date"
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={toDateInput(project.deadline)}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, deadline: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item)),
                  )
                }
              />
              <Button
                variant="ghost"
                onClick={async () => {
                  const updated = await savePatch<Project>(`/api/projects/${project.id}`, {
                    name: project.name,
                    entityId: project.entityId,
                    status: project.status,
                    nextMilestone: project.nextMilestone,
                    deadline: project.deadline,
                  });
                  if (!updated) return;
                  setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                }}
              >
                Save
              </Button>
            </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/20 p-3 text-sm text-white/65">
              No projects for the selected date filter.
            </div>
          )}
        </div>
      </section>
      ) : null}

      {activeSection === "FINANCE" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Finance</h2>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <Button variant={financeViewMode === "ALL" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setFinanceViewMode("ALL")}>
            All dates
          </Button>
          <Button variant={financeViewMode === "SELECTED_DAY" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setFinanceViewMode("SELECTED_DAY")}>
            Select day
          </Button>
          {financeViewMode === "SELECTED_DAY" ? (
            <input
              type="date"
              className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
              value={financeFocusDate}
              onChange={(event) => setFinanceFocusDate((event.target as HTMLInputElement).value || todayDate)}
            />
          ) : null}
          <span className="text-xs text-white/65">
            Net worth auto-calculates from assets - liabilities • {visibleTransactions.length} transactions • {visibleUpcomingExpenses.length} bills
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <DataStudioPanel title="Balance sheet" summary="This drives net worth on the dashboard." defaultOpen>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/70">Net worth</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(draftNetWorth)}
                </h3>
                <p className="mt-1 text-sm text-white/65">Statement date {financeFocusDate}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Latest saved</p>
                <p className="mt-1 text-sm text-white">
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(latestFinanceSnapshot.netWorth)}
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              <input
                type="date"
                className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
                value={financeFocusDate}
                onChange={(event) => setFinanceFocusDate((event.target as HTMLInputElement).value || todayDate)}
              />
              <input
                className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
                placeholder="Total assets"
                value={balanceSheetDraft.totalAssets}
                onChange={(event) =>
                  setBalanceSheetOverrides((current) => ({
                    ...current,
                    [financeFocusDate]: {
                      ...balanceSheetDraft,
                      totalAssets: (event.target as HTMLInputElement).value,
                    },
                  }))
                }
              />
              <input
                className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
                placeholder="Total liabilities"
                value={balanceSheetDraft.totalLiabilities}
                onChange={(event) =>
                  setBalanceSheetOverrides((current) => ({
                    ...current,
                    [financeFocusDate]: {
                      ...balanceSheetDraft,
                      totalLiabilities: (event.target as HTMLInputElement).value,
                    },
                  }))
                }
              />
              <input
                className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
                placeholder="Liquid assets"
                value={balanceSheetDraft.liquidAssets}
                onChange={(event) =>
                  setBalanceSheetOverrides((current) => ({
                    ...current,
                    [financeFocusDate]: {
                      ...balanceSheetDraft,
                      liquidAssets: (event.target as HTMLInputElement).value,
                    },
                  }))
                }
              />
              <Button onClick={saveBalanceSheet}>Save Balance Sheet</Button>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48">Assets</p>
                <p className="mt-2 text-lg font-semibold text-emerald-100">
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(balanceSheetSnapshot.totalAssets)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48">Liabilities</p>
                <p className="mt-2 text-lg font-semibold text-rose-100">
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(balanceSheetSnapshot.totalLiabilities)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48">Liquid assets</p>
                <p className="mt-2 text-lg font-semibold text-cyan-100">
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(balanceSheetSnapshot.liquidAssets)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48">Net worth</p>
                <p className={`mt-2 text-lg font-semibold ${balanceSheetSnapshot.netWorth >= 0 ? "text-emerald-100" : "text-rose-100"}`}>
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(balanceSheetSnapshot.netWorth)}
                </p>
              </div>
            </div>
          </DataStudioPanel>

          <DataStudioPanel title="Runway basis" summary="Runway is calculated from your real expense history, not a manual guess." defaultOpen>
            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-4">
                {financeInsights.scenarios.map((scenario) => (
                  <div key={scenario.basis} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48">{scenario.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(scenario.monthlyEquivalent)}
                    </p>
                    <p className="mt-1 text-xs text-white/55">{scenario.periodLabel}</p>
                    <p className="mt-2 text-sm text-cyan-100">{scenario.runwayMonths.toFixed(1)} mo runway</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm text-white/65">Default runway</p>
                <p className="mt-1 text-sm text-white/85">
                  LOS currently uses the 90-day average burn for the main runway number. Shorter windows are shown above so you can compare and audit volatility.
                </p>
                <p className="mt-1 text-sm text-white/65">
                  Current month spend {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(financeInsights.currentMonthExpenses)}
                  {" · "}
                  Last month {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(financeInsights.previousMonthExpenses)}
                </p>
              </div>
            </div>
          </DataStudioPanel>

        <DataStudioPanel
          title="Burn trends"
          summary="Use this for weekly audits and to see where money has been going over time."
          defaultOpen
        >
          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Weekly expense trend</p>
                  <p className="text-xs text-white/55">Last 8 rolling weeks</p>
                </div>
                <div className="grid gap-2">
                  {financeInsights.weeklyTrend.map((point) => {
                    const maxExpense = Math.max(...financeInsights.weeklyTrend.map((item) => item.expenses), 1);
                    const width = Math.max(8, Math.round((point.expenses / maxExpense) * 100));
                    return (
                      <div key={point.label} className="grid gap-1 md:grid-cols-[108px_1fr_84px] md:items-center">
                        <p className="text-xs text-white/55">{point.label}</p>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-rose-300" style={{ width: `${width}%` }} />
                        </div>
                        <p className="text-right text-xs text-white/75">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(point.expenses)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Monthly net trend</p>
                  <p className="text-xs text-white/55">Last 6 months</p>
                </div>
                <div className="grid gap-2">
                  {financeInsights.monthlyTrend.map((point) => {
                    const maxNet = Math.max(...financeInsights.monthlyTrend.map((item) => Math.abs(item.net)), 1);
                    const width = Math.max(8, Math.round((Math.abs(point.net) / maxNet) * 100));
                    return (
                      <div key={point.label} className="grid gap-1 md:grid-cols-[88px_1fr_88px] md:items-center">
                        <p className="text-xs text-white/55">{point.label}</p>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${point.net >= 0 ? "bg-emerald-300" : "bg-amber-300"}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <p className={`text-right text-xs ${point.net >= 0 ? "text-emerald-100" : "text-amber-100"}`}>
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(point.net)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-semibold text-white">Top categories (90d)</p>
                <div className="mt-3 space-y-2">
                  {financeInsights.topExpenseCategories.length > 0 ? (
                    financeInsights.topExpenseCategories.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/25 px-2 py-1.5 text-sm text-white/85">
                        <div>
                          <p>{item.label}</p>
                          <p className="text-xs text-white/55">{item.sharePercent}% of 90d spend</p>
                        </div>
                        <p>{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(item.total)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/55">No expense categories recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-semibold text-white">Top entities (90d)</p>
                <div className="mt-3 space-y-2">
                  {financeInsights.topExpenseEntities.length > 0 ? (
                    financeInsights.topExpenseEntities.map((item) => (
                      <div key={`${item.entityId ?? item.label}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/25 px-2 py-1.5 text-sm text-white/85">
                        <div>
                          <p>{item.label}</p>
                          <p className="text-xs text-white/55">{item.sharePercent}% of 90d spend</p>
                        </div>
                        <p>{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(item.total)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/55">No entity spend history yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DataStudioPanel>
        </div>

        <DataStudioPanel
          title="Transactions"
          summary="Income and expense entries here drive the home finance card."
        >
          <div className="grid gap-2 md:grid-cols-6">
            <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTransaction.date} onChange={(event) => setNewTransaction((current) => ({ ...current, date: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Amount" value={newTransaction.amount} onChange={(event) => setNewTransaction((current) => ({ ...current, amount: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTransaction.type} onChange={(event) => setNewTransaction((current) => ({ ...current, type: (event.target as HTMLInputElement | HTMLSelectElement).value as Transaction["type"] }))}>{TXN_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTransaction.entityId} onChange={(event) => setNewTransaction((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Category" value={newTransaction.category} onChange={(event) => setNewTransaction((current) => ({ ...current, category: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <Button onClick={async () => {
              const amount = Number(newTransaction.amount);
              if (!Number.isFinite(amount)) return;
              const created = await saveCreate<Transaction>("/api/transactions", {
                date: newTransaction.date,
                amount,
                type: newTransaction.type,
                entityId: newTransaction.entityId,
                category: newTransaction.category,
              });
              if (!created) return;
              setTransactions((current) => [created, ...current]);
              setNewTransaction((current) => ({ ...current, amount: "", category: "" }));
            }}>Add Txn</Button>
          </div>

          <div className="space-y-2">
            {visibleTransactions.map((transaction) => (
              <article key={transaction.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-6">
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(transaction.date)} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, date: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(transaction.amount)} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, amount: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={transaction.type} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, type: (event.target as HTMLInputElement | HTMLSelectElement).value as Transaction["type"] } : item))}>{TXN_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={transaction.entityId} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={transaction.category} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, category: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<Transaction>(`/api/transactions/${transaction.id}`, transaction);
                  if (!updated) return;
                  setTransactions((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))}
          </div>
        </DataStudioPanel>

        <DataStudioPanel
          title="Upcoming bills"
          summary="Due dates feed the dashboard. Marking a bill paid also adds it into burn tracking if no matching expense exists yet."
        >
          <div className="grid gap-2 md:grid-cols-7">
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Bill" value={newUpcomingExpense.bill} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, bill: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Amount" value={newUpcomingExpense.amount} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, amount: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newUpcomingExpense.dueDate} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, dueDate: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newUpcomingExpense.frequency} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, frequency: (event.target as HTMLInputElement | HTMLSelectElement).value as UpcomingExpense["frequency"] }))}>{EXPENSE_FREQUENCIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newUpcomingExpense.entityId} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
            <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white">
              <input type="checkbox" checked={newUpcomingExpense.paid} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, paid: (event.target as HTMLInputElement).checked }))} />
              Paid
            </label>
            <Button onClick={async () => {
              const amount = Number(newUpcomingExpense.amount);
              if (!Number.isFinite(amount)) return;
              const created = await saveCreate<UpcomingExpense>("/api/upcoming-expenses", {
                bill: newUpcomingExpense.bill,
                amount,
                dueDate: newUpcomingExpense.dueDate,
                frequency: newUpcomingExpense.frequency,
                entityId: newUpcomingExpense.entityId,
                paid: newUpcomingExpense.paid,
              });
              if (!created) return;
              setUpcomingExpenses((current) => [created, ...current]);
              setNewUpcomingExpense((current) => ({ ...current, bill: "", amount: "" }));
            }}>Add Upcoming</Button>
          </div>

          <div className="space-y-2">
            {visibleUpcomingExpenses.map((expense) => (
              <article key={expense.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-7">
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={expense.bill} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, bill: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(expense.amount)} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, amount: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(expense.dueDate)} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, dueDate: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={expense.frequency} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, frequency: (event.target as HTMLInputElement | HTMLSelectElement).value as UpcomingExpense["frequency"] } : item))}>{EXPENSE_FREQUENCIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={expense.entityId} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
                <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white">
                  <input type="checkbox" checked={expense.paid} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, paid: (event.target as HTMLInputElement).checked } : item))} />
                  Paid
                </label>
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<UpcomingExpense>(`/api/upcoming-expenses/${expense.id}`, expense);
                  if (!updated) return;
                  setUpcomingExpenses((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))}
          </div>
        </DataStudioPanel>

        <DataStudioPanel
          title="Other finance metrics"
          summary="Optional. Use this only if you want extra finance tracking beyond balance sheet, transactions, and bills."
        >
          <div className="grid gap-2 md:grid-cols-6">
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Metric name" value={newMetric.metricName} onChange={(event) => setNewMetric((current) => ({ ...current, metricName: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newMetric.category} onChange={(event) => setNewMetric((current) => ({ ...current, category: (event.target as HTMLInputElement | HTMLSelectElement).value as MetricPoint["category"] }))}>
              {METRIC_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newMetric.unit} onChange={(event) => setNewMetric((current) => ({ ...current, unit: (event.target as HTMLInputElement | HTMLSelectElement).value as MetricPoint["unit"] }))}>
              {METRIC_UNITS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Value" value={newMetric.value} onChange={(event) => setNewMetric((current) => ({ ...current, value: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newMetric.date} onChange={(event) => setNewMetric((current) => ({ ...current, date: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <Button onClick={async () => {
              const value = Number(newMetric.value);
              if (!Number.isFinite(value)) return;
              const created = await saveCreate<MetricPoint>("/api/metrics", {
                metricName: newMetric.metricName,
                category: newMetric.category,
                unit: newMetric.unit,
                value,
                date: newMetric.date,
              });
              if (!created) return;
              setMetrics((current) => [created, ...current]);
              setNewMetric((current) => ({ ...current, metricName: "", value: "" }));
            }}>Add Metric</Button>
          </div>

          <div className="space-y-2">
            {visibleMetrics.map((metric) => (
              <article key={metric.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-6">
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={metric.metricName} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, metricName: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={metric.category} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, category: (event.target as HTMLInputElement | HTMLSelectElement).value as MetricPoint["category"] } : item))}>
                  {METRIC_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={metric.unit} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, unit: (event.target as HTMLInputElement | HTMLSelectElement).value as MetricPoint["unit"] } : item))}>
                  {METRIC_UNITS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(metric.value)} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, value: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(metric.date)} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, date: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<MetricPoint>(`/api/metrics/${metric.id}`, {
                    metricName: metric.metricName,
                    category: metric.category,
                    unit: metric.unit,
                    value: metric.value,
                    date: metric.date,
                  });
                  if (!updated) return;
                  setMetrics((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))}
          </div>
        </DataStudioPanel>
      </section>
      ) : null}

      {activeSection === "LEARNING" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Learning</h2>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <Button variant={learningViewMode === "ALL" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setLearningViewMode("ALL")}>
            All dates
          </Button>
          <Button variant={learningViewMode === "SELECTED_DAY" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setLearningViewMode("SELECTED_DAY")}>
            Select day
          </Button>
          {learningViewMode === "SELECTED_DAY" ? (
            <input
              type="date"
              className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
              value={learningFocusDate}
              onChange={(event) => setLearningFocusDate((event.target as HTMLInputElement).value || todayDate)}
            />
          ) : null}
          <span className="text-xs text-white/65">{pathways.length} pathways • {visibleCourses.length} courses</span>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Pathway title" value={newPathway.title} onChange={(event) => setNewPathway((current) => ({ ...current, title: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newPathway.status} onChange={(event) => setNewPathway((current) => ({ ...current, status: (event.target as HTMLInputElement | HTMLSelectElement).value as Pathway["status"] }))}>{PATHWAY_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Progress %" value={newPathway.progressPercent} onChange={(event) => setNewPathway((current) => ({ ...current, progressPercent: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<Pathway>("/api/pathways", {
              title: newPathway.title,
              status: newPathway.status,
              progressPercent: Number(newPathway.progressPercent) || 0,
            });
            if (!created) return;
            setPathways((current) => [created, ...current]);
            setNewPathway((current) => ({ ...current, title: "" }));
          }}>Add Pathway</Button>
        </div>

        <div className="space-y-2">
          {pathways.map((pathway) => (
            <article key={pathway.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-4">
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={pathway.title} onChange={(event) => setPathways((current) => current.map((item) => item.id === pathway.id ? { ...item, title: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={pathway.status} onChange={(event) => setPathways((current) => current.map((item) => item.id === pathway.id ? { ...item, status: (event.target as HTMLInputElement | HTMLSelectElement).value as Pathway["status"] } : item))}>{PATHWAY_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(pathway.progressPercent)} onChange={(event) => setPathways((current) => current.map((item) => item.id === pathway.id ? { ...item, progressPercent: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
              <Button variant="ghost" onClick={async () => {
                const updated = await savePatch<Pathway>(`/api/pathways/${pathway.id}`, pathway);
                if (!updated) return;
                setPathways((current) => current.map((item) => item.id === updated.id ? updated : item));
              }}>Save</Button>
            </article>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-7">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Course title" value={newCourse.title} onChange={(event) => setNewCourse((current) => ({ ...current, title: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCourse.pathwayId} onChange={(event) => setNewCourse((current) => ({ ...current, pathwayId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{pathways.map((pathway) => <option key={pathway.id} value={pathway.id}>{pathway.title}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCourse.status} onChange={(event) => setNewCourse((current) => ({ ...current, status: (event.target as HTMLInputElement | HTMLSelectElement).value as CourseCert["status"] }))}>{COURSE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCourse.targetDate} onChange={(event) => setNewCourse((current) => ({ ...current, targetDate: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Est hrs" value={newCourse.estimatedHours} onChange={(event) => setNewCourse((current) => ({ ...current, estimatedHours: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Done hrs" value={newCourse.completedHours} onChange={(event) => setNewCourse((current) => ({ ...current, completedHours: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<CourseCert>("/api/courses", {
              title: newCourse.title,
              pathwayId: newCourse.pathwayId,
              status: newCourse.status,
              targetDate: newCourse.targetDate || undefined,
              estimatedHours: newCourse.estimatedHours ? Number(newCourse.estimatedHours) : undefined,
              completedHours: newCourse.completedHours ? Number(newCourse.completedHours) : undefined,
              appliedProgressPercent: Number(newCourse.appliedProgressPercent) || 0,
            });
            if (!created) return;
            setCourses((current) => [created, ...current]);
            setNewCourse((current) => ({ ...current, title: "", estimatedHours: "", completedHours: "" }));
          }}>Add Course</Button>
        </div>

        <div className="space-y-2">
          {visibleCourses.map((course) => (
            <article key={course.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-7">
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={course.title} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, title: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={course.pathwayId} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, pathwayId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))}>{pathways.map((pathway) => <option key={pathway.id} value={pathway.id}>{pathway.title}</option>)}</select>
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={course.status} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, status: (event.target as HTMLInputElement | HTMLSelectElement).value as CourseCert["status"] } : item))}>{COURSE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(course.targetDate)} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, targetDate: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(course.estimatedHours ?? "")} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, estimatedHours: (event.target as HTMLInputElement | HTMLSelectElement).value ? Number((event.target as HTMLInputElement | HTMLSelectElement).value) : undefined } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(course.completedHours ?? "")} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, completedHours: (event.target as HTMLInputElement | HTMLSelectElement).value ? Number((event.target as HTMLInputElement | HTMLSelectElement).value) : undefined } : item))} />
              <Button variant="ghost" onClick={async () => {
                const updated = await savePatch<CourseCert>(`/api/courses/${course.id}`, {
                  title: course.title,
                  pathwayId: course.pathwayId,
                  status: course.status,
                  targetDate: course.targetDate,
                  estimatedHours: course.estimatedHours,
                  completedHours: course.completedHours,
                  appliedProgressPercent: course.appliedProgressPercent,
                });
                if (!updated) return;
                setCourses((current) => current.map((item) => item.id === updated.id ? updated : item));
              }}>Save</Button>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeSection === "ACCOUNTS" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Accounts</h2>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <Button variant={accountsViewMode === "ALL" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setAccountsViewMode("ALL")}>
            All dates
          </Button>
          <Button variant={accountsViewMode === "SELECTED_DAY" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setAccountsViewMode("SELECTED_DAY")}>
            Select day
          </Button>
          {accountsViewMode === "SELECTED_DAY" ? (
            <input
              type="date"
              className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
              value={accountsFocusDate}
              onChange={(event) => setAccountsFocusDate((event.target as HTMLInputElement).value || todayDate)}
            />
          ) : null}
          <span className="text-xs text-white/65">{visibleAccounts.length} account{visibleAccounts.length === 1 ? "" : "s"}</span>
        </div>

        <div className="grid gap-2 md:grid-cols-9">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Service" value={newAccount.service} onChange={(event) => setNewAccount((current) => ({ ...current, service: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newAccount.entityId} onChange={(event) => setNewAccount((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Login" value={newAccount.loginIdentifier} onChange={(event) => setNewAccount((current) => ({ ...current, loginIdentifier: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newAccount.role} onChange={(event) => setNewAccount((current) => ({ ...current, role: (event.target as HTMLInputElement | HTMLSelectElement).value as AccountRef["role"] }))}>{ACCOUNT_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"><input type="checkbox" checked={newAccount.twoFactorEnabled} onChange={(event) => setNewAccount((current) => ({ ...current, twoFactorEnabled: (event.target as HTMLInputElement).checked }))} />2FA</label>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Vault URL" value={newAccount.vaultItemUrl} onChange={(event) => setNewAccount((current) => ({ ...current, vaultItemUrl: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newAccount.lastRotated} onChange={(event) => setNewAccount((current) => ({ ...current, lastRotated: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<AccountRef>("/api/accounts/manage", {
              service: newAccount.service,
              entityId: newAccount.entityId,
              loginIdentifier: newAccount.loginIdentifier,
              role: newAccount.role,
              twoFactorEnabled: newAccount.twoFactorEnabled,
              vaultItemUrl: newAccount.vaultItemUrl,
              lastRotated: newAccount.lastRotated || undefined,
            });
            if (!created) return;
            setAccounts((current) => [created, ...current]);
            setNewAccount((current) => ({ ...current, service: "", loginIdentifier: "", vaultItemUrl: "", lastRotated: "" }));
          }}>Add Account</Button>
        </div>

        <div className="space-y-2">
          {visibleAccounts.map((account) => (
            <article key={account.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-8">
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.service} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, service: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.entityId} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.loginIdentifier} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, loginIdentifier: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.role} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, role: (event.target as HTMLInputElement | HTMLSelectElement).value as AccountRef["role"] } : item))}>{ACCOUNT_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"><input type="checkbox" checked={account.twoFactorEnabled} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, twoFactorEnabled: (event.target as HTMLInputElement).checked } : item))} />2FA</label>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.vaultItemUrl} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, vaultItemUrl: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(account.lastRotated)} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, lastRotated: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
              <Button variant="ghost" onClick={async () => {
                const updated = await savePatch<AccountRef>(`/api/accounts/manage/${account.id}`, {
                  service: account.service,
                  entityId: account.entityId,
                  loginIdentifier: account.loginIdentifier,
                  role: account.role,
                  twoFactorEnabled: account.twoFactorEnabled,
                  vaultItemUrl: account.vaultItemUrl,
                  lastRotated: account.lastRotated,
                });
                if (!updated) return;
                setAccounts((current) => current.map((item) => item.id === updated.id ? updated : item));
              }}>Save</Button>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeSection === "HEALTH" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Health</h2>
          <p className="text-xs text-white/65">
            {visibleHealthLogs.length} logs • {visibleWorkouts.length} workouts
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={healthViewMode === "TODAY_YESTERDAY" ? "solid" : "ghost"}
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setHealthViewMode("TODAY_YESTERDAY")}
            >
              Today + Yesterday
            </Button>
            <Button
              variant={healthViewMode === "SELECTED_DAY" ? "solid" : "ghost"}
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setHealthViewMode("SELECTED_DAY")}
            >
              Select day
            </Button>
            {healthViewMode === "SELECTED_DAY" ? (
              <input
                type="date"
                className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
                value={healthFocusDate}
                onChange={(event) => setHealthFocusDate((event.target as HTMLInputElement).value || todayDate)}
              />
            ) : null}
            <span className="text-xs text-white/65">
              Editing date: {activeHealthDate}
            </span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-8">
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newHealthLog.entityId} onChange={(event) => setNewHealthLog((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Steps" value={newHealthLog.steps} onChange={(event) => setNewHealthLog((current) => ({ ...current, steps: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Sleep h" value={newHealthLog.sleepHours} onChange={(event) => setNewHealthLog((current) => ({ ...current, sleepHours: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Rest HR" value={newHealthLog.restingHeartRate} onChange={(event) => setNewHealthLog((current) => ({ ...current, restingHeartRate: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Hydration L" value={newHealthLog.hydrationLiters} onChange={(event) => setNewHealthLog((current) => ({ ...current, hydrationLiters: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Recovery" value={newHealthLog.recoveryScore} onChange={(event) => setNewHealthLog((current) => ({ ...current, recoveryScore: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Weight kg" value={newHealthLog.weightKg} onChange={(event) => setNewHealthLog((current) => ({ ...current, weightKg: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<HealthDailyLog>("/api/health/logs", {
              date: activeHealthDate,
              entityId: newHealthLog.entityId,
              steps: Number(newHealthLog.steps) || 0,
              sleepHours: Number(newHealthLog.sleepHours) || 0,
              restingHeartRate: Number(newHealthLog.restingHeartRate) || 0,
              hydrationLiters: Number(newHealthLog.hydrationLiters) || 0,
              recoveryScore: Number(newHealthLog.recoveryScore) || 0,
              weightKg: newHealthLog.weightKg ? Number(newHealthLog.weightKg) : undefined,
            });
            if (!created) return;
            setHealthLogs((current) => [created, ...current]);
            setNewHealthLog((current) => ({ ...current, steps: "", sleepHours: "", restingHeartRate: "", hydrationLiters: "", recoveryScore: "", weightKg: "" }));
          }}>Add Log</Button>
        </div>

        <div className="space-y-2">
          {visibleHealthLogs.length > 0 ? (
            visibleHealthLogs.map((log) => (
              <article key={log.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-9">
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(log.date)} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, date: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={log.entityId} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(log.steps)} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, steps: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(log.sleepHours)} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, sleepHours: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(log.restingHeartRate)} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, restingHeartRate: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(log.hydrationLiters)} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, hydrationLiters: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(log.recoveryScore)} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, recoveryScore: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(log.weightKg ?? "")} onChange={(event) => setHealthLogs((current) => current.map((item) => item.id === log.id ? { ...item, weightKg: (event.target as HTMLInputElement | HTMLSelectElement).value ? Number((event.target as HTMLInputElement | HTMLSelectElement).value) : undefined } : item))} />
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<HealthDailyLog>(`/api/health/logs/${log.id}`, log);
                  if (!updated) return;
                  setHealthLogs((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/20 p-3 text-sm text-white/65">
              No health logs for this date filter yet. Add one above.
            </div>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-7">
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.entityId} onChange={(event) => setNewWorkout((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.sessionType} onChange={(event) => setNewWorkout((current) => ({ ...current, sessionType: (event.target as HTMLInputElement | HTMLSelectElement).value as WorkoutSession["sessionType"] }))}>{WORKOUT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.intensity} onChange={(event) => setNewWorkout((current) => ({ ...current, intensity: (event.target as HTMLInputElement | HTMLSelectElement).value as WorkoutSession["intensity"] }))}>{WORKOUT_INTENSITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Duration min" value={newWorkout.durationMinutes} onChange={(event) => setNewWorkout((current) => ({ ...current, durationMinutes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Volume kg" value={newWorkout.volumeLoadKg} onChange={(event) => setNewWorkout((current) => ({ ...current, volumeLoadKg: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Notes" value={newWorkout.notes} onChange={(event) => setNewWorkout((current) => ({ ...current, notes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<WorkoutSession>("/api/health/workouts", {
              date: activeHealthDate,
              entityId: newWorkout.entityId,
              sessionType: newWorkout.sessionType,
              intensity: newWorkout.intensity,
              durationMinutes: Number(newWorkout.durationMinutes) || 0,
              volumeLoadKg: newWorkout.volumeLoadKg ? Number(newWorkout.volumeLoadKg) : undefined,
              notes: newWorkout.notes || undefined,
            });
            if (!created) return;
            setWorkouts((current) => [created, ...current]);
            setNewWorkout((current) => ({ ...current, durationMinutes: "", volumeLoadKg: "", notes: "" }));
          }}>Add Workout</Button>
        </div>

        <div className="space-y-2">
          {visibleWorkouts.length > 0 ? (
            visibleWorkouts.map((workout) => (
              <article key={workout.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-8">
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(workout.date)} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, date: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={workout.entityId} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={workout.sessionType} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, sessionType: (event.target as HTMLInputElement | HTMLSelectElement).value as WorkoutSession["sessionType"] } : item))}>{WORKOUT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={workout.intensity} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, intensity: (event.target as HTMLInputElement | HTMLSelectElement).value as WorkoutSession["intensity"] } : item))}>{WORKOUT_INTENSITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(workout.durationMinutes)} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, durationMinutes: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(workout.volumeLoadKg ?? "")} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, volumeLoadKg: (event.target as HTMLInputElement | HTMLSelectElement).value ? Number((event.target as HTMLInputElement | HTMLSelectElement).value) : undefined } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={workout.notes ?? ""} onChange={(event) => setWorkouts((current) => current.map((item) => item.id === workout.id ? { ...item, notes: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<WorkoutSession>(`/api/health/workouts/${workout.id}`, workout);
                  if (!updated) return;
                  setWorkouts((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/20 p-3 text-sm text-white/65">
              No workouts for this date filter yet. Add one above.
            </div>
          )}
        </div>
      </section>
      ) : null}

      {activeSection === "FAMILY" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Family</h2>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <Button variant={familyViewMode === "ALL" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setFamilyViewMode("ALL")}>
            All dates
          </Button>
          <Button variant={familyViewMode === "SELECTED_DAY" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setFamilyViewMode("SELECTED_DAY")}>
            Select day
          </Button>
          {familyViewMode === "SELECTED_DAY" ? (
            <input
              type="date"
              className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
              value={familyFocusDate}
              onChange={(event) => setFamilyFocusDate((event.target as HTMLInputElement).value || todayDate)}
            />
          ) : null}
          <span className="text-xs text-white/65">
            {visibleFamilyEvents.length} events
          </span>
        </div>

        <DataStudioPanel
          title="Events"
          summary="Use this as the main family workflow. Add birthdays, catchups, admin items, and anything tied to a person."
          defaultOpen
        >
          <div className="grid gap-2 md:grid-cols-7">
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Event title" value={newFamilyEvent.title} onChange={(event) => setNewFamilyEvent((current) => ({ ...current, title: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newFamilyEvent.date} onChange={(event) => setNewFamilyEvent((current) => ({ ...current, date: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newFamilyEvent.category} onChange={(event) => setNewFamilyEvent((current) => ({ ...current, category: (event.target as HTMLInputElement | HTMLSelectElement).value as FamilyEvent["category"] }))}>{FAMILY_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newFamilyEvent.importance} onChange={(event) => setNewFamilyEvent((current) => ({ ...current, importance: (event.target as HTMLInputElement | HTMLSelectElement).value as FamilyEvent["importance"] }))}>{FAMILY_IMPORTANCE.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newFamilyEvent.entityId} onChange={(event) => setNewFamilyEvent((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Notes" value={newFamilyEvent.notes} onChange={(event) => setNewFamilyEvent((current) => ({ ...current, notes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <Button onClick={async () => {
              const created = await saveCreate<FamilyEvent>("/api/family/events", {
                title: newFamilyEvent.title,
                date: newFamilyEvent.date,
                category: newFamilyEvent.category,
                importance: newFamilyEvent.importance,
                entityId: newFamilyEvent.entityId || undefined,
                notes: newFamilyEvent.notes || undefined,
              });
              if (!created) return;
              setFamilyEvents((current) => [created, ...current]);
              setNewFamilyEvent((current) => ({ ...current, title: "", notes: "" }));
            }}>Add Event</Button>
          </div>

          <div className="space-y-2">
            {visibleFamilyEvents.map((eventRow) => (
              <article key={eventRow.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-7">
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={eventRow.title} onChange={(event) => setFamilyEvents((current) => current.map((item) => item.id === eventRow.id ? { ...item, title: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(eventRow.date)} onChange={(event) => setFamilyEvents((current) => current.map((item) => item.id === eventRow.id ? { ...item, date: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={eventRow.category} onChange={(event) => setFamilyEvents((current) => current.map((item) => item.id === eventRow.id ? { ...item, category: (event.target as HTMLInputElement | HTMLSelectElement).value as FamilyEvent["category"] } : item))}>{FAMILY_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={eventRow.importance} onChange={(event) => setFamilyEvents((current) => current.map((item) => item.id === eventRow.id ? { ...item, importance: (event.target as HTMLInputElement | HTMLSelectElement).value as FamilyEvent["importance"] } : item))}>{FAMILY_IMPORTANCE.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={eventRow.entityId ?? ""} onChange={(event) => setFamilyEvents((current) => current.map((item) => item.id === eventRow.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))}><option value="">No entity</option>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={eventRow.notes ?? ""} onChange={(event) => setFamilyEvents((current) => current.map((item) => item.id === eventRow.id ? { ...item, notes: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<FamilyEvent>(`/api/family/events/${eventRow.id}`, eventRow);
                  if (!updated) return;
                  setFamilyEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))}
          </div>
        </DataStudioPanel>

        <DataStudioPanel
          title="People reminders"
          summary="Optional separate cadence tracker. Ignore this if event entries are enough for your family workflow."
        >
          <div className="grid gap-2 md:grid-cols-7">
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Person" value={newCheckin.person} onChange={(event) => setNewCheckin((current) => ({ ...current, person: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCheckin.relationType} onChange={(event) => setNewCheckin((current) => ({ ...current, relationType: (event.target as HTMLInputElement | HTMLSelectElement).value as RelationshipCheckin["relationType"] }))}>{RELATION_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCheckin.lastMeaningfulContact} onChange={(event) => setNewCheckin((current) => ({ ...current, lastMeaningfulContact: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Cadence days" value={newCheckin.targetCadenceDays} onChange={(event) => setNewCheckin((current) => ({ ...current, targetCadenceDays: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCheckin.entityId} onChange={(event) => setNewCheckin((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
            <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Notes" value={newCheckin.notes} onChange={(event) => setNewCheckin((current) => ({ ...current, notes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
            <Button onClick={async () => {
              const created = await saveCreate<RelationshipCheckin>("/api/family/checkins", {
                person: newCheckin.person,
                relationType: newCheckin.relationType,
                lastMeaningfulContact: newCheckin.lastMeaningfulContact,
                targetCadenceDays: Number(newCheckin.targetCadenceDays) || 7,
                entityId: newCheckin.entityId || undefined,
                notes: newCheckin.notes || undefined,
              });
              if (!created) return;
              setRelationshipCheckins((current) => [created, ...current]);
              setNewCheckin((current) => ({ ...current, person: "", notes: "" }));
            }}>Add Reminder</Button>
          </div>

          <div className="space-y-2">
            {visibleRelationshipCheckins.map((checkin) => (
              <article key={checkin.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-7">
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={checkin.person} onChange={(event) => setRelationshipCheckins((current) => current.map((item) => item.id === checkin.id ? { ...item, person: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={checkin.relationType} onChange={(event) => setRelationshipCheckins((current) => current.map((item) => item.id === checkin.id ? { ...item, relationType: (event.target as HTMLInputElement | HTMLSelectElement).value as RelationshipCheckin["relationType"] } : item))}>{RELATION_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(checkin.lastMeaningfulContact)} onChange={(event) => setRelationshipCheckins((current) => current.map((item) => item.id === checkin.id ? { ...item, lastMeaningfulContact: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(checkin.targetCadenceDays)} onChange={(event) => setRelationshipCheckins((current) => current.map((item) => item.id === checkin.id ? { ...item, targetCadenceDays: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
                <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={checkin.entityId ?? ""} onChange={(event) => setRelationshipCheckins((current) => current.map((item) => item.id === checkin.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))}><option value="">No entity</option>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
                <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={checkin.notes ?? ""} onChange={(event) => setRelationshipCheckins((current) => current.map((item) => item.id === checkin.id ? { ...item, notes: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
                <Button variant="ghost" onClick={async () => {
                  const updated = await savePatch<RelationshipCheckin>(`/api/family/checkins/${checkin.id}`, checkin);
                  if (!updated) return;
                  setRelationshipCheckins((current) => current.map((item) => item.id === updated.id ? updated : item));
                }}>Save</Button>
              </article>
            ))}
          </div>
        </DataStudioPanel>
      </section>
      ) : null}

      {activeSection === "TRANSITION" ? (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Transition</h2>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-3">
          <Button variant={transitionViewMode === "ALL" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setTransitionViewMode("ALL")}>
            All dates
          </Button>
          <Button variant={transitionViewMode === "SELECTED_DAY" ? "solid" : "ghost"} className="h-8 rounded-full px-3 text-xs" onClick={() => setTransitionViewMode("SELECTED_DAY")}>
            Select day
          </Button>
          {transitionViewMode === "SELECTED_DAY" ? (
            <input
              type="date"
              className="h-8 rounded-lg border border-white/20 bg-slate-950/60 px-2 text-sm text-white"
              value={transitionFocusDate}
              onChange={(event) => setTransitionFocusDate((event.target as HTMLInputElement).value || todayDate)}
            />
          ) : null}
          <span className="text-xs text-white/65">{visibleTimeOffPlans.length} plan{visibleTimeOffPlans.length === 1 ? "" : "s"}</span>
        </div>

        <div className="grid gap-2 md:grid-cols-8">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Plan title" value={newTimeOffPlan.title} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, title: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTimeOffPlan.status} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, status: (event.target as HTMLInputElement | HTMLSelectElement).value as TimeOffPlan["status"] }))}>{TIMEOFF_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTimeOffPlan.targetDate} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, targetDate: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Estimated AUD" value={newTimeOffPlan.estimatedCostAud} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, estimatedCostAud: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTimeOffPlan.priority} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, priority: (event.target as HTMLInputElement | HTMLSelectElement).value as TimeOffPlan["priority"] }))}>{TIMEOFF_PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTimeOffPlan.entityId} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Notes" value={newTimeOffPlan.notes} onChange={(event) => setNewTimeOffPlan((current) => ({ ...current, notes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const amount = Number(newTimeOffPlan.estimatedCostAud);
            if (!Number.isFinite(amount)) return;
            const created = await saveCreate<TimeOffPlan>("/api/transition/plans", {
              title: newTimeOffPlan.title,
              status: newTimeOffPlan.status,
              targetDate: newTimeOffPlan.targetDate || undefined,
              estimatedCostAud: amount,
              priority: newTimeOffPlan.priority,
              entityId: newTimeOffPlan.entityId || undefined,
              notes: newTimeOffPlan.notes || undefined,
            });
            if (!created) return;
            setTimeOffPlans((current) => [created, ...current]);
            setNewTimeOffPlan((current) => ({ ...current, title: "", estimatedCostAud: "", targetDate: "", notes: "" }));
          }}>Add Plan</Button>
        </div>

        <div className="space-y-2">
          {visibleTimeOffPlans.map((plan) => (
            <article key={plan.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-8">
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={plan.title} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, title: (event.target as HTMLInputElement | HTMLSelectElement).value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={plan.status} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, status: (event.target as HTMLInputElement | HTMLSelectElement).value as TimeOffPlan["status"] } : item))}>{TIMEOFF_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(plan.targetDate)} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, targetDate: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(plan.estimatedCostAud)} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, estimatedCostAud: Number((event.target as HTMLInputElement | HTMLSelectElement).value) || 0 } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={plan.priority} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, priority: (event.target as HTMLInputElement | HTMLSelectElement).value as TimeOffPlan["priority"] } : item))}>{TIMEOFF_PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={plan.entityId ?? ""} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))}><option value="">No entity</option>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={plan.notes ?? ""} onChange={(event) => setTimeOffPlans((current) => current.map((item) => item.id === plan.id ? { ...item, notes: (event.target as HTMLInputElement | HTMLSelectElement).value || undefined } : item))} />
              <Button variant="ghost" onClick={async () => {
                const updated = await savePatch<TimeOffPlan>(`/api/transition/plans/${plan.id}`, plan);
                if (!updated) return;
                setTimeOffPlans((current) => current.map((item) => item.id === updated.id ? updated : item));
              }}>Save</Button>
            </article>
          ))}
        </div>
      </section>
      ) : null}
    </div>
  );
}
