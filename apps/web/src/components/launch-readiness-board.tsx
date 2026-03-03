"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomeDashboardData } from "@los/types";

interface LaunchReadinessBoardProps {
  dashboard: HomeDashboardData;
}

const MANUAL_CHECKS = [
  "Environment variables set for target deployment",
  "Notion database schemas verified against docs",
  "Credential policy confirmed (vault references only)",
  "PWA install and offline fallback tested on mobile",
  "Weekly review flow completed once end-to-end",
] as const;
const STORAGE_KEY = "los_launch_manual_checks_v1";

export function LaunchReadinessBoard({ dashboard }: LaunchReadinessBoardProps) {
  const [checks, setChecks] = useState<boolean[]>(() => MANUAL_CHECKS.map(() => false));
  const [hydrated, setHydrated] = useState(false);
  const referenceTime = useMemo(() => new Date(dashboard.generatedAt).getTime(), [dashboard.generatedAt]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length === MANUAL_CHECKS.length) {
          const normalized = parsed.map((item) => item === true);
          setChecks(normalized);
        }
      }
    } catch {
      // Ignore malformed client storage and keep defaults.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
  }, [checks, hydrated]);

  const autoSignals = useMemo(() => {
    const hasRunway = dashboard.runway.monthsOfFreedom > 0;
    const criticalExpenses = dashboard.upcomingExpenses.filter((expense) => {
      const days = Math.ceil((new Date(expense.dueDate).getTime() - referenceTime) / (24 * 60 * 60 * 1000));
      return days <= 2;
    }).length;
    const taskRiskCount = dashboard.nextTasks.filter((task) => {
      if (task.status === "DONE") return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate).getTime() <= referenceTime;
    }).length;

    return [
      {
        label: "Runway is positive",
        pass: hasRunway,
        detail: `${dashboard.runway.monthsOfFreedom.toFixed(1)} months`,
      },
      {
        label: "No critical expenses due in <=2 days",
        pass: criticalExpenses === 0,
        detail: `${criticalExpenses} critical`,
      },
      {
        label: "No overdue tasks in next queue",
        pass: taskRiskCount === 0,
        detail: `${taskRiskCount} overdue`,
      },
    ];
  }, [dashboard, referenceTime]);

  const manualCompletion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const autoPass = autoSignals.every((signal) => signal.pass);
  const launchReady = autoPass && checks.every(Boolean);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <h2 className="mb-3 text-base font-semibold text-white">Automated Readiness Signals</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {autoSignals.map((signal) => (
            <article
              key={signal.label}
              className={`rounded-xl border px-3 py-2 text-sm ${
                signal.pass
                  ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
                  : "border-rose-300/60 bg-rose-300/15 text-rose-100"
              }`}
            >
              <p className="font-medium">{signal.label}</p>
              <p className="text-xs">{signal.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Manual Launch Checklist</h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-white/70">{manualCompletion}% complete</p>
            <button
              type="button"
              onClick={() => setChecks(MANUAL_CHECKS.map(() => false))}
              className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${manualCompletion >= 80 ? "bg-emerald-300" : manualCompletion >= 40 ? "bg-amber-300" : "bg-rose-300"}`}
            style={{ width: `${manualCompletion}%` }}
          />
        </div>

        <div className="space-y-2">
          {MANUAL_CHECKS.map((item, index) => (
            <label key={item} className="flex items-start gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white/85">
              <input
                type="checkbox"
                checked={checks[index]}
                onChange={(event) => {
                  const nextChecked = event.currentTarget.checked;
                  setChecks((current) => {
                    const copy = [...current];
                    copy[index] = nextChecked;
                    return copy;
                  });
                }}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>

      <section
        className={`rounded-2xl border px-3 py-3 text-sm font-semibold uppercase tracking-[0.08em] ${
          launchReady
            ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
            : "border-amber-300/60 bg-amber-300/15 text-amber-100"
        }`}
      >
        {launchReady ? "Launch Ready" : "Launch not ready yet"}
      </section>
    </div>
  );
}
