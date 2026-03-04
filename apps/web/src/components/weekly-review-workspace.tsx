"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomeDashboardData, WeeklyReviewDraftResponse } from "@los/types";
import { Button } from "@/components/ui/button";
import { WeeklySummaryPanel } from "@/components/weekly-summary-panel";
import { daysUntil, formatDate } from "@/lib/format";
import { getTaskTrackState, trackBarClass, trackToneClass } from "@/lib/track";

interface WeeklyReviewWorkspaceProps {
  dashboard: HomeDashboardData;
}

const CHECKLIST_ITEMS = [
  "Confirm top 3 active projects still match current priorities",
  "Clear, close, or reschedule stale waiting tasks",
  "Review runway and next 7 days of expenses",
  "Set next week's top 3 outcomes",
] as const;
const STORAGE_KEY = "los_weekly_review_workspace_v1";

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function WeeklyReviewWorkspace({ dashboard }: WeeklyReviewWorkspaceProps) {
  const [checklist, setChecklist] = useState<boolean[]>(() => CHECKLIST_ITEMS.map(() => false));
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const [outcomes, setOutcomes] = useState<string[]>(["", "", ""]);
  const [winsText, setWinsText] = useState("");
  const [stuckText, setStuckText] = useState("");
  const [runwayCommentary, setRunwayCommentary] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as {
        checklist?: unknown;
        outcomes?: unknown;
        remainingSeconds?: unknown;
        winsText?: unknown;
        stuckText?: unknown;
        runwayCommentary?: unknown;
      };

      if (Array.isArray(parsed.checklist) && parsed.checklist.length === CHECKLIST_ITEMS.length) {
        setChecklist(parsed.checklist.map((item) => item === true));
      }

      if (Array.isArray(parsed.outcomes) && parsed.outcomes.length === 3) {
        setOutcomes(parsed.outcomes.map((item) => (typeof item === "string" ? item : "")));
      }

      if (typeof parsed.remainingSeconds === "number" && Number.isFinite(parsed.remainingSeconds)) {
        setRemainingSeconds(Math.max(0, Math.round(parsed.remainingSeconds)));
      }

      if (typeof parsed.winsText === "string") {
        setWinsText(parsed.winsText);
      }
      if (typeof parsed.stuckText === "string") {
        setStuckText(parsed.stuckText);
      }
      if (typeof parsed.runwayCommentary === "string") {
        setRunwayCommentary(parsed.runwayCommentary);
      }
    } catch {
      // Ignore malformed storage payloads.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        checklist,
        outcomes,
        remainingSeconds,
        winsText,
        stuckText,
        runwayCommentary,
      }),
    );
  }, [checklist, outcomes, remainingSeconds, winsText, stuckText, runwayCommentary, hydrated]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const id = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [running]);

  const completionPercent = useMemo(() => {
    const done = checklist.filter(Boolean).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  const atRiskTasks = useMemo(
    () => dashboard.nextTasks.filter((task) => getTaskTrackState(task) !== "ON_TRACK"),
    [dashboard.nextTasks],
  );

  const upcomingExpenses = useMemo(
    () => dashboard.upcomingExpenses.filter((expense) => daysUntil(expense.dueDate) <= 7),
    [dashboard.upcomingExpenses],
  );

  const reviewReady = checklist.every(Boolean) && outcomes.every((item) => item.trim().length > 0);

  const timerTone =
    remainingSeconds <= 5 * 60
      ? "border-rose-300/60 bg-rose-300/15 text-rose-100"
      : remainingSeconds <= 10 * 60
        ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
        : "border-emerald-300/60 bg-emerald-300/15 text-emerald-100";

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const fallbackError = `Request failed (${response.status})`;
      try {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error?.trim() || fallbackError);
      } catch {
        throw new Error(fallbackError);
      }
    }

    return (await response.json()) as T;
  }

  async function copyBrief() {
    const topOutcomes = outcomes.map((item, index) => `${index + 1}. ${item.trim()}`).join("\n");
    const wins = winsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((item) => `- ${item}`)
      .join("\n");
    const text = [
      `LOS Weekly Review - ${new Date().toLocaleDateString("en-AU")}`,
      `Checklist completion: ${completionPercent}%`,
      `Runway: ${dashboard.runway.monthsOfFreedom} months`,
      "",
      "Wins:",
      wins || "- No wins captured yet",
      "",
      "Top 3 outcomes:",
      topOutcomes,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function splitLines(value: string): string[] {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function generateDraft() {
    setDraftLoading(true);
    setDraftError(null);
    try {
      const payload = await postJson<WeeklyReviewDraftResponse>("/api/reviews/weekly-draft", {
        reviewDate: new Date().toISOString(),
        taskWindowDays: 7,
      });

      setWinsText(payload.wins.join("\n"));
      setStuckText(payload.stuck.join("\n"));
      setRunwayCommentary(payload.runwayCommentary);
      setOutcomes((current) =>
        current.map((item, index) => (item.trim() ? item : payload.topThreeNextWeek[index] ?? item)),
      );
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : "Draft generation failed. Please retry.");
    } finally {
      setDraftLoading(false);
    }
  }

  async function saveReview() {
    if (!reviewReady) {
      return;
    }

    setSaveState("saving");
    const wins = splitLines(winsText);
    const stuck = splitLines(stuckText);
    try {
      await postJson("/api/reviews", {
        reviewDate: new Date().toISOString(),
        wins,
        stuck,
        topThreeNextWeek: outcomes.map((item) => item.trim()).filter(Boolean).slice(0, 3),
        runwayCommentary:
          runwayCommentary.trim() ||
          `Runway is ${dashboard.runway.monthsOfFreedom} months with monthly burn at ${dashboard.runway.monthlyBurn.toLocaleString("en-AU")} AUD.`,
      });

      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">20-Minute Review Flow</h2>
            <div className={`rounded-lg border px-3 py-1 text-sm font-semibold ${timerTone}`}>{formatTimer(remainingSeconds)}</div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant={running ? "ghost" : "solid"} onClick={() => setRunning((value) => !value)}>
              {running ? "Pause Timer" : "Start Timer"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRunning(false);
                setRemainingSeconds(20 * 60);
              }}
            >
              Reset 20m
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRunning(false);
                setRemainingSeconds(20 * 60);
                setChecklist(CHECKLIST_ITEMS.map(() => false));
                setOutcomes(["", "", ""]);
                setWinsText("");
                setStuckText("");
                setRunwayCommentary("");
                setDraftError(null);
                setSaveState("idle");
              }}
            >
              Clear Review
            </Button>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs text-white/70">
              <span>Completion</span>
              <span>{completionPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${completionPercent >= 75 ? "bg-emerald-300" : completionPercent >= 40 ? "bg-amber-300" : "bg-rose-300"}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item, index) => (
              <label key={item} className="flex items-start gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white/85">
                <input
                  type="checkbox"
                  checked={checklist[index]}
                  onChange={(event) => {
                    const nextChecked = event.currentTarget.checked;
                    setChecklist((current) => {
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-4">
          <h2 className="mb-3 text-base font-semibold text-white">Financial Signal</h2>
          <p className="text-2xl font-semibold text-teal-100">{dashboard.runway.monthsOfFreedom} months</p>
          <p className="text-xs text-white/70">
            Liquid {dashboard.runway.liquidAssets.toLocaleString("en-AU")} AUD · Burn {dashboard.runway.monthlyBurn.toLocaleString("en-AU")} AUD
          </p>

          <div className="mt-3 space-y-2 text-sm">
            {upcomingExpenses.slice(0, 4).map((expense) => {
              const days = daysUntil(expense.dueDate);
              const tone =
                days <= 2
                  ? "border-rose-300/60 bg-rose-300/15 text-rose-100"
                  : days <= 5
                    ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                    : "border-emerald-300/60 bg-emerald-300/10 text-emerald-100";

              return (
                <div key={expense.id} className={`rounded-lg border px-2 py-1 ${tone}`}>
                  <p>{expense.bill}</p>
                  <p className="text-xs">Due {formatDate(expense.dueDate)} · {days}d</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-7">
          <h2 className="mb-3 text-base font-semibold text-white">Next Week Top 3 Outcomes</h2>
          <div className="space-y-2">
            {outcomes.map((value, index) => (
              <input
                key={`outcome-${index + 1}`}
                value={value}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setOutcomes((current) => {
                    const copy = [...current];
                    copy[index] = nextValue;
                    return copy;
                  });
                }}
                className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
                placeholder={`Outcome ${index + 1}`}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={!reviewReady} onClick={() => void copyBrief()}>
              {copied ? "Copied" : "Copy Weekly Brief"}
            </Button>
            <Button variant="ghost" disabled={draftLoading} onClick={() => void generateDraft()}>
              {draftLoading ? "Generating Draft..." : "Generate Draft"}
            </Button>
            <Button disabled={!reviewReady || saveState === "saving"} onClick={() => void saveReview()}>
              {saveState === "saving" ? "Saving..." : "Save Review"}
            </Button>
            <div
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${
                reviewReady
                  ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
                  : "border-amber-300/60 bg-amber-300/15 text-amber-100"
              }`}
            >
              {reviewReady ? "Review Ready" : "Complete checklist + outcomes"}
            </div>
            {saveState === "saved" ? (
              <div className="rounded-lg border border-emerald-300/60 bg-emerald-300/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
                Synced to Notion
              </div>
            ) : null}
            {saveState === "error" ? (
              <div className="rounded-lg border border-rose-300/60 bg-rose-300/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-rose-100">
                Save Failed
              </div>
            ) : null}
            {draftError ? (
              <div className="rounded-lg border border-rose-300/60 bg-rose-300/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-rose-100">
                {draftError}
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Wins (one per line)</label>
            <textarea
              value={winsText}
              onChange={(event) => setWinsText(event.currentTarget.value)}
              className="min-h-20 w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="Completed high-impact task..."
            />
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Stuck / Risks (one per line)</label>
            <textarea
              value={stuckText}
              onChange={(event) => setStuckText(event.currentTarget.value)}
              className="min-h-20 w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="Waiting on approval..."
            />
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Runway Commentary</label>
            <textarea
              value={runwayCommentary}
              onChange={(event) => setRunwayCommentary(event.currentTarget.value)}
              className="min-h-20 w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="Financial posture for next week..."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-5">
          <h2 className="mb-3 text-base font-semibold text-white">Task Risk Snapshot</h2>
          <div className="space-y-2">
            {atRiskTasks.length === 0 ? (
              <p className="rounded-lg border border-emerald-300/60 bg-emerald-300/10 px-2 py-1 text-sm text-emerald-100">
                No immediate task risk in your next queue.
              </p>
            ) : (
              atRiskTasks.map((task) => {
                const state = getTaskTrackState(task);
                return (
                  <article key={task.id} className="rounded-lg border border-white/10 bg-slate-950/35 p-2">
                    <div className={`mb-1 flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${trackToneClass(state)}`}>
                      <span>{state.replace("_", " ")}</span>
                      <span className={`inline-block h-2 w-10 rounded-full ${trackBarClass(state)}`} />
                    </div>
                    <p className="text-sm text-white">{task.title}</p>
                    <p className="text-xs text-white/65">Due {formatDate(task.dueDate)}</p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <h2 className="mb-3 text-base font-semibold text-white">AI Read-Only Summary</h2>
        <WeeklySummaryPanel />
      </section>
    </div>
  );
}
