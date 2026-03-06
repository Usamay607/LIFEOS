"use client";

import { useMemo, useState } from "react";
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

type SaveState = "idle" | "saving" | "saved" | "error";

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

function panelTone(status: SaveState): string {
  if (status === "saved") return "text-emerald-200";
  if (status === "error") return "text-rose-200";
  if (status === "saving") return "text-amber-200";
  return "text-white/60";
}

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
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
  const [status, setStatus] = useState<SaveState>("idle");

  const entityOptions = useMemo(() => entities.map((entity) => ({ id: entity.id, name: entity.name })), [entities]);

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
    date: new Date().toISOString().slice(0, 10),
    entityId: entityOptions[0]?.id ?? "",
    steps: "",
    sleepHours: "",
    restingHeartRate: "",
    hydrationLiters: "",
    recoveryScore: "",
    weightKg: "",
  });

  const [newWorkout, setNewWorkout] = useState({
    date: new Date().toISOString().slice(0, 10),
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

  async function savePatch<T>(url: string, body: unknown): Promise<T | null> {
    setStatus("saving");
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setStatus("error");
      return null;
    }

    const payload = (await response.json()) as T;
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 1000);
    return payload;
  }

  async function saveCreate<T>(url: string, body: unknown): Promise<T | null> {
    setStatus("saving");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setStatus("error");
      return null;
    }

    const payload = (await response.json()) as T;
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 1000);
    return payload;
  }

  return (
    <div className="space-y-6">
      <p className={`text-sm ${panelTone(status)}`}>
        {status === "saving" && "Saving to LOS + Notion..."}
        {status === "saved" && "Saved"}
        {status === "error" && "Save failed"}
        {status === "idle" && "All core edits can be done here and sync to Notion."}
      </p>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Projects</h2>

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
          {projects.map((project) => (
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
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Finance (Metrics, Transactions, Upcoming)</h2>

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
          {metrics.slice(0, 10).map((metric) => (
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
          {transactions.slice(0, 12).map((transaction) => (
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
          {upcomingExpenses.slice(0, 10).map((expense) => (
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
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Learning (Pathways + Courses)</h2>

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
          {courses.slice(0, 12).map((course) => (
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

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Accounts</h2>

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
          {accounts.slice(0, 12).map((account) => (
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

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Health (Daily Logs + Workouts)</h2>

        <div className="grid gap-2 md:grid-cols-8">
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newHealthLog.date} onChange={(event) => setNewHealthLog((current) => ({ ...current, date: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newHealthLog.entityId} onChange={(event) => setNewHealthLog((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Steps" value={newHealthLog.steps} onChange={(event) => setNewHealthLog((current) => ({ ...current, steps: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Sleep h" value={newHealthLog.sleepHours} onChange={(event) => setNewHealthLog((current) => ({ ...current, sleepHours: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Rest HR" value={newHealthLog.restingHeartRate} onChange={(event) => setNewHealthLog((current) => ({ ...current, restingHeartRate: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Hydration L" value={newHealthLog.hydrationLiters} onChange={(event) => setNewHealthLog((current) => ({ ...current, hydrationLiters: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Recovery" value={newHealthLog.recoveryScore} onChange={(event) => setNewHealthLog((current) => ({ ...current, recoveryScore: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Weight kg" value={newHealthLog.weightKg} onChange={(event) => setNewHealthLog((current) => ({ ...current, weightKg: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<HealthDailyLog>("/api/health/logs", {
              date: newHealthLog.date,
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
          {healthLogs.slice(0, 10).map((log) => (
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
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-8">
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.date} onChange={(event) => setNewWorkout((current) => ({ ...current, date: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.entityId} onChange={(event) => setNewWorkout((current) => ({ ...current, entityId: (event.target as HTMLInputElement | HTMLSelectElement).value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.sessionType} onChange={(event) => setNewWorkout((current) => ({ ...current, sessionType: (event.target as HTMLInputElement | HTMLSelectElement).value as WorkoutSession["sessionType"] }))}>{WORKOUT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newWorkout.intensity} onChange={(event) => setNewWorkout((current) => ({ ...current, intensity: (event.target as HTMLInputElement | HTMLSelectElement).value as WorkoutSession["intensity"] }))}>{WORKOUT_INTENSITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Duration min" value={newWorkout.durationMinutes} onChange={(event) => setNewWorkout((current) => ({ ...current, durationMinutes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Volume kg" value={newWorkout.volumeLoadKg} onChange={(event) => setNewWorkout((current) => ({ ...current, volumeLoadKg: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Notes" value={newWorkout.notes} onChange={(event) => setNewWorkout((current) => ({ ...current, notes: (event.target as HTMLInputElement | HTMLSelectElement).value }))} />
          <Button onClick={async () => {
            const created = await saveCreate<WorkoutSession>("/api/health/workouts", {
              date: newWorkout.date,
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
          {workouts.slice(0, 10).map((workout) => (
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
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Family (Events + Check-ins)</h2>

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
          {familyEvents.slice(0, 10).map((eventRow) => (
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
          }}>Add Check-in</Button>
        </div>

        <div className="space-y-2">
          {relationshipCheckins.slice(0, 10).map((checkin) => (
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
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold text-white">Transition (Time-Off Plans)</h2>

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
          {timeOffPlans.slice(0, 12).map((plan) => (
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
    </div>
  );
}
