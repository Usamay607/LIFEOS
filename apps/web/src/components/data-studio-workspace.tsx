"use client";

import { useMemo, useState } from "react";
import type {
  AccountRef,
  CourseCert,
  Entity,
  MetricPoint,
  Pathway,
  Project,
  Transaction,
  UpcomingExpense,
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
}

const PROJECT_STATUSES: Array<Project["status"]> = ["ACTIVE", "ON_HOLD", "CEASED"];
const PATHWAY_STATUSES: Array<Pathway["status"]> = ["ACTIVE", "LATER", "COMPLETED"];
const COURSE_STATUSES: Array<CourseCert["status"]> = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
const ACCOUNT_ROLES: Array<AccountRef["role"]> = ["OWNER", "ADMIN", "USER"];
const METRIC_CATEGORIES: Array<MetricPoint["category"]> = ["FINANCE", "HEALTH", "LEARNING", "WORK", "LIFE"];
const METRIC_UNITS: Array<MetricPoint["unit"]> = ["AUD", "KG", "PERCENT", "HOURS", "COUNT"];
const TXN_TYPES: Array<Transaction["type"]> = ["INCOME", "EXPENSE"];
const EXPENSE_FREQUENCIES: Array<UpcomingExpense["frequency"]> = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_OFF"];

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
}: DataStudioWorkspaceProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [pathways, setPathways] = useState<Pathway[]>(initialPathways);
  const [courses, setCourses] = useState<CourseCert[]>(initialCourses);
  const [accounts, setAccounts] = useState<AccountRef[]>(initialAccounts);
  const [metrics, setMetrics] = useState<MetricPoint[]>(initialMetrics);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [upcomingExpenses, setUpcomingExpenses] = useState<UpcomingExpense[]>(initialUpcomingExpenses);
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
            onChange={(event) => setNewProject((current) => ({ ...current, name: event.currentTarget.value }))}
          />
          <select
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            value={newProject.entityId}
            onChange={(event) => setNewProject((current) => ({ ...current, entityId: event.currentTarget.value }))}
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
            onChange={(event) => setNewProject((current) => ({ ...current, status: event.currentTarget.value as Project["status"] }))}
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
            onChange={(event) => setNewProject((current) => ({ ...current, nextMilestone: event.currentTarget.value }))}
          />
          <input
            type="date"
            className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"
            value={newProject.deadline}
            onChange={(event) => setNewProject((current) => ({ ...current, deadline: event.currentTarget.value }))}
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
                    current.map((item) => (item.id === project.id ? { ...item, name: event.currentTarget.value } : item)),
                  )
                }
              />
              <select
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={project.entityId}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, entityId: event.currentTarget.value } : item)),
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
                    current.map((item) => (item.id === project.id ? { ...item, status: event.currentTarget.value as Project["status"] } : item)),
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
                    current.map((item) => (item.id === project.id ? { ...item, nextMilestone: event.currentTarget.value } : item)),
                  )
                }
              />
              <input
                type="date"
                className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"
                value={toDateInput(project.deadline)}
                onChange={(event) =>
                  setProjects((current) =>
                    current.map((item) => (item.id === project.id ? { ...item, deadline: event.currentTarget.value || undefined } : item)),
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
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Metric name" value={newMetric.metricName} onChange={(event) => setNewMetric((current) => ({ ...current, metricName: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newMetric.category} onChange={(event) => setNewMetric((current) => ({ ...current, category: event.currentTarget.value as MetricPoint["category"] }))}>
            {METRIC_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newMetric.unit} onChange={(event) => setNewMetric((current) => ({ ...current, unit: event.currentTarget.value as MetricPoint["unit"] }))}>
            {METRIC_UNITS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Value" value={newMetric.value} onChange={(event) => setNewMetric((current) => ({ ...current, value: event.currentTarget.value }))} />
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newMetric.date} onChange={(event) => setNewMetric((current) => ({ ...current, date: event.currentTarget.value }))} />
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
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={metric.metricName} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, metricName: event.currentTarget.value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={metric.category} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, category: event.currentTarget.value as MetricPoint["category"] } : item))}>
                {METRIC_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={metric.unit} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, unit: event.currentTarget.value as MetricPoint["unit"] } : item))}>
                {METRIC_UNITS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(metric.value)} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, value: Number(event.currentTarget.value) || 0 } : item))} />
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(metric.date)} onChange={(event) => setMetrics((current) => current.map((item) => item.id === metric.id ? { ...item, date: event.currentTarget.value } : item))} />
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
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTransaction.date} onChange={(event) => setNewTransaction((current) => ({ ...current, date: event.currentTarget.value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Amount" value={newTransaction.amount} onChange={(event) => setNewTransaction((current) => ({ ...current, amount: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTransaction.type} onChange={(event) => setNewTransaction((current) => ({ ...current, type: event.currentTarget.value as Transaction["type"] }))}>{TXN_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newTransaction.entityId} onChange={(event) => setNewTransaction((current) => ({ ...current, entityId: event.currentTarget.value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Category" value={newTransaction.category} onChange={(event) => setNewTransaction((current) => ({ ...current, category: event.currentTarget.value }))} />
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
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(transaction.date)} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, date: event.currentTarget.value } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(transaction.amount)} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, amount: Number(event.currentTarget.value) || 0 } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={transaction.type} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, type: event.currentTarget.value as Transaction["type"] } : item))}>{TXN_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={transaction.entityId} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, entityId: event.currentTarget.value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={transaction.category} onChange={(event) => setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, category: event.currentTarget.value } : item))} />
              <Button variant="ghost" onClick={async () => {
                const updated = await savePatch<Transaction>(`/api/transactions/${transaction.id}`, transaction);
                if (!updated) return;
                setTransactions((current) => current.map((item) => item.id === updated.id ? updated : item));
              }}>Save</Button>
            </article>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-7">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Bill" value={newUpcomingExpense.bill} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, bill: event.currentTarget.value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Amount" value={newUpcomingExpense.amount} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, amount: event.currentTarget.value }))} />
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newUpcomingExpense.dueDate} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, dueDate: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newUpcomingExpense.frequency} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, frequency: event.currentTarget.value as UpcomingExpense["frequency"] }))}>{EXPENSE_FREQUENCIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newUpcomingExpense.entityId} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, entityId: event.currentTarget.value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white">
            <input type="checkbox" checked={newUpcomingExpense.paid} onChange={(event) => setNewUpcomingExpense((current) => ({ ...current, paid: event.currentTarget.checked }))} />
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
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={expense.bill} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, bill: event.currentTarget.value } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(expense.amount)} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, amount: Number(event.currentTarget.value) || 0 } : item))} />
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(expense.dueDate)} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, dueDate: event.currentTarget.value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={expense.frequency} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, frequency: event.currentTarget.value as UpcomingExpense["frequency"] } : item))}>{EXPENSE_FREQUENCIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={expense.entityId} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, entityId: event.currentTarget.value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
              <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white">
                <input type="checkbox" checked={expense.paid} onChange={(event) => setUpcomingExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, paid: event.currentTarget.checked } : item))} />
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
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Pathway title" value={newPathway.title} onChange={(event) => setNewPathway((current) => ({ ...current, title: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newPathway.status} onChange={(event) => setNewPathway((current) => ({ ...current, status: event.currentTarget.value as Pathway["status"] }))}>{PATHWAY_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Progress %" value={newPathway.progressPercent} onChange={(event) => setNewPathway((current) => ({ ...current, progressPercent: event.currentTarget.value }))} />
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
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={pathway.title} onChange={(event) => setPathways((current) => current.map((item) => item.id === pathway.id ? { ...item, title: event.currentTarget.value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={pathway.status} onChange={(event) => setPathways((current) => current.map((item) => item.id === pathway.id ? { ...item, status: event.currentTarget.value as Pathway["status"] } : item))}>{PATHWAY_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(pathway.progressPercent)} onChange={(event) => setPathways((current) => current.map((item) => item.id === pathway.id ? { ...item, progressPercent: Number(event.currentTarget.value) || 0 } : item))} />
              <Button variant="ghost" onClick={async () => {
                const updated = await savePatch<Pathway>(`/api/pathways/${pathway.id}`, pathway);
                if (!updated) return;
                setPathways((current) => current.map((item) => item.id === updated.id ? updated : item));
              }}>Save</Button>
            </article>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-7">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Course title" value={newCourse.title} onChange={(event) => setNewCourse((current) => ({ ...current, title: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCourse.pathwayId} onChange={(event) => setNewCourse((current) => ({ ...current, pathwayId: event.currentTarget.value }))}>{pathways.map((pathway) => <option key={pathway.id} value={pathway.id}>{pathway.title}</option>)}</select>
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCourse.status} onChange={(event) => setNewCourse((current) => ({ ...current, status: event.currentTarget.value as CourseCert["status"] }))}>{COURSE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newCourse.targetDate} onChange={(event) => setNewCourse((current) => ({ ...current, targetDate: event.currentTarget.value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Est hrs" value={newCourse.estimatedHours} onChange={(event) => setNewCourse((current) => ({ ...current, estimatedHours: event.currentTarget.value }))} />
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Done hrs" value={newCourse.completedHours} onChange={(event) => setNewCourse((current) => ({ ...current, completedHours: event.currentTarget.value }))} />
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
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={course.title} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, title: event.currentTarget.value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={course.pathwayId} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, pathwayId: event.currentTarget.value } : item))}>{pathways.map((pathway) => <option key={pathway.id} value={pathway.id}>{pathway.title}</option>)}</select>
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={course.status} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, status: event.currentTarget.value as CourseCert["status"] } : item))}>{COURSE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(course.targetDate)} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, targetDate: event.currentTarget.value || undefined } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(course.estimatedHours ?? "")} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, estimatedHours: event.currentTarget.value ? Number(event.currentTarget.value) : undefined } : item))} />
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={String(course.completedHours ?? "")} onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, completedHours: event.currentTarget.value ? Number(event.currentTarget.value) : undefined } : item))} />
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

        <div className="grid gap-2 md:grid-cols-8">
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Service" value={newAccount.service} onChange={(event) => setNewAccount((current) => ({ ...current, service: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newAccount.entityId} onChange={(event) => setNewAccount((current) => ({ ...current, entityId: event.currentTarget.value }))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Login" value={newAccount.loginIdentifier} onChange={(event) => setNewAccount((current) => ({ ...current, loginIdentifier: event.currentTarget.value }))} />
          <select className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newAccount.role} onChange={(event) => setNewAccount((current) => ({ ...current, role: event.currentTarget.value as AccountRef["role"] }))}>{ACCOUNT_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white"><input type="checkbox" checked={newAccount.twoFactorEnabled} onChange={(event) => setNewAccount((current) => ({ ...current, twoFactorEnabled: event.currentTarget.checked }))} />2FA</label>
          <input className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" placeholder="Vault URL" value={newAccount.vaultItemUrl} onChange={(event) => setNewAccount((current) => ({ ...current, vaultItemUrl: event.currentTarget.value }))} />
          <input type="date" className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white" value={newAccount.lastRotated} onChange={(event) => setNewAccount((current) => ({ ...current, lastRotated: event.currentTarget.value }))} />
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
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.service} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, service: event.currentTarget.value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.entityId} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, entityId: event.currentTarget.value } : item))}>{entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.loginIdentifier} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, loginIdentifier: event.currentTarget.value } : item))} />
              <select className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.role} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, role: event.currentTarget.value as AccountRef["role"] } : item))}>{ACCOUNT_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white"><input type="checkbox" checked={account.twoFactorEnabled} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, twoFactorEnabled: event.currentTarget.checked } : item))} />2FA</label>
              <input className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={account.vaultItemUrl} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, vaultItemUrl: event.currentTarget.value } : item))} />
              <input type="date" className="rounded-lg border border-white/20 bg-slate-950/50 px-2 py-1 text-sm text-white" value={toDateInput(account.lastRotated)} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, lastRotated: event.currentTarget.value || undefined } : item))} />
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
    </div>
  );
}
