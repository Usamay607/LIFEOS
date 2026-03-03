"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomeDashboardData } from "@los/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/format";

interface FocusWorkspaceProps {
  dashboard: HomeDashboardData;
}

interface FocusState {
  day: string;
  outcomes: string[];
  completed: boolean[];
  nextAction: string;
  blocker: string;
}

const STORAGE_KEY = "los_focus_workspace_v1";

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
}

export function FocusWorkspace({ dashboard }: FocusWorkspaceProps) {
  const tasks = useMemo(() => dashboard.nextTasks.slice(0, 3), [dashboard.nextTasks]);

  const [outcomes, setOutcomes] = useState<string[]>(() => tasks.map((task) => task.title));
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);
  const [nextAction, setNextAction] = useState("");
  const [blocker, setBlocker] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const initialOutcomes = tasks.map((task) => task.title);
    setOutcomes(initialOutcomes);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as FocusState;
      if (!parsed || parsed.day !== todayKey()) {
        return;
      }

      if (Array.isArray(parsed.outcomes) && parsed.outcomes.length === 3) {
        setOutcomes(parsed.outcomes.map((item) => (typeof item === "string" ? item : "")));
      }
      if (Array.isArray(parsed.completed) && parsed.completed.length === 3) {
        setCompleted(parsed.completed.map((item) => item === true));
      }
      if (typeof parsed.nextAction === "string") {
        setNextAction(parsed.nextAction);
      }
      if (typeof parsed.blocker === "string") {
        setBlocker(parsed.blocker);
      }
    } catch {
      // Ignore malformed storage state.
    } finally {
      setHydrated(true);
    }
  }, [tasks]);

  useEffect(() => {
    let cancelled = false;
    async function loadRemote() {
      try {
        const response = await fetch(`/api/focus/state?date=${encodeURIComponent(todayKey())}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) return;
        const remote = (await response.json()) as FocusState | null;
        if (!remote || cancelled) return;
        if (Array.isArray(remote.outcomes) && remote.outcomes.length === 3) {
          setOutcomes(remote.outcomes);
        }
        if (Array.isArray(remote.completed) && remote.completed.length === 3) {
          setCompleted(remote.completed.map((item) => item === true));
        }
        setNextAction(remote.nextAction ?? "");
        setBlocker(remote.blocker ?? "");
      } catch {
        // Local fallback continues if API fails.
      }
    }
    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: FocusState = {
      day: todayKey(),
      outcomes,
      completed,
      nextAction,
      blocker,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [outcomes, completed, nextAction, blocker, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(async () => {
      setSyncStatus("saving");
      try {
        const response = await fetch("/api/focus/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: todayKey(),
            outcomes,
            completed,
            nextAction,
            blocker,
          }),
        });
        setSyncStatus(response.ok ? "saved" : "error");
      } catch {
        setSyncStatus("error");
      }
    }, 700);

    return () => window.clearTimeout(id);
  }, [outcomes, completed, nextAction, blocker, hydrated]);

  const completionPercent = Math.round((completed.filter(Boolean).length / 3) * 100);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top 3 Outcomes Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-xs text-white/70">
            <span>Completion</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${completionPercent >= 67 ? "bg-emerald-300" : completionPercent >= 34 ? "bg-amber-300" : "bg-rose-300"}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <ol className="space-y-3">
            {tasks.map((task, index) => (
              <li key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.08em] text-white/65">Outcome {index + 1}</p>
                  <StatusPill value={task.status} />
                </div>
                <div className="mb-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={completed[index] ?? false}
                    onChange={(event) => {
                      const nextChecked = event.currentTarget.checked;
                      setCompleted((current) => {
                        const copy = [...current];
                        copy[index] = nextChecked;
                        return copy;
                      });
                    }}
                  />
                  <input
                    value={outcomes[index] ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setOutcomes((current) => {
                        const copy = [...current];
                        copy[index] = nextValue;
                        return copy;
                      });
                    }}
                    className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-2 py-1 text-sm text-white outline-none focus:border-teal-300"
                  />
                </div>
                <p className="text-xs text-white/60">
                  Due {formatDate(task.dueDate)} · {task.context.toLowerCase()}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setOutcomes(tasks.map((task) => task.title));
                setCompleted([false, false, false]);
                setNextAction("");
                setBlocker("");
              }}
            >
              Reset Today
            </Button>
            <p className="mt-2 text-xs text-white/65">
              {syncStatus === "saving" && "Syncing to Notion..."}
              {syncStatus === "saved" && "Synced to Notion"}
              {syncStatus === "error" && "Sync failed, local data still saved"}
              {syncStatus === "idle" && "Ready"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Next Physical Action</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              value={nextAction}
              onChange={(event) => setNextAction(event.currentTarget.value)}
              placeholder="What is the very next concrete action?"
              className="w-full rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            />
            <textarea
              value={blocker}
              onChange={(event) => setBlocker(event.currentTarget.value)}
              placeholder="Any blocker or risk for today?"
              className="mt-2 min-h-24 w-full rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Runway Guardrail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-white/15 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-white/65">Months of Freedom</p>
              <p className="mt-1 text-3xl font-semibold text-teal-200">{dashboard.runway.monthsOfFreedom}</p>
              <p className="mt-2 text-sm text-white/75">Finish one high-value outcome before opening new work.</p>
            </div>

            <div className="mt-3 space-y-2">
              {dashboard.upcomingExpenses.slice(0, 3).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-sm text-white">{expense.bill}</p>
                  <p className="text-xs text-white/70">{formatDate(expense.dueDate)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
