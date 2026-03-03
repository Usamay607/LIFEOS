"use client";

import { useMemo, useState } from "react";
import type { CreateJournalEntryInput, Entity, JournalEntry } from "@los/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

type MoodFilter = JournalEntry["mood"] | "ALL";

interface JournalWorkspaceProps {
  initialEntries: JournalEntry[];
  entities: Entity[];
}

function scoreTone(score?: number) {
  if (!score || score < 5) {
    return {
      text: "text-rose-100",
      panel: "border-rose-300/60 bg-rose-300/15",
      bar: "bg-rose-300",
      width: `${Math.max(0, (score ?? 0) * 10)}%`,
    };
  }
  if (score < 8) {
    return {
      text: "text-amber-100",
      panel: "border-amber-300/60 bg-amber-300/15",
      bar: "bg-amber-300",
      width: `${score * 10}%`,
    };
  }
  return {
    text: "text-emerald-100",
    panel: "border-emerald-300/60 bg-emerald-300/15",
    bar: "bg-emerald-300",
    width: `${score * 10}%`,
  };
}

function moodClasses(mood: JournalEntry["mood"]) {
  if (mood === "GREAT") {
    return "border-emerald-300/60 bg-emerald-300/15 text-emerald-100";
  }
  if (mood === "GOOD") {
    return "border-cyan-300/60 bg-cyan-300/15 text-cyan-100";
  }
  if (mood === "LOW") {
    return "border-rose-300/60 bg-rose-300/15 text-rose-100";
  }
  return "border-amber-300/60 bg-amber-300/15 text-amber-100";
}

export function JournalWorkspace({ initialEntries, entities }: JournalWorkspaceProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [filterMood, setFilterMood] = useState<MoodFilter>("ALL");
  const [filterEntityId, setFilterEntityId] = useState<string>("ALL");

  const [title, setTitle] = useState("");
  const [entryBody, setEntryBody] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState<JournalEntry["mood"]>("NEUTRAL");
  const [tagsInput, setTagsInput] = useState("");
  const [entityId, setEntityId] = useState<string>(entities[0]?.id ?? "");
  const [energyScore, setEnergyScore] = useState<number>(7);
  const [focusScore, setFocusScore] = useState<number>(7);
  const [saving, setSaving] = useState(false);

  const entityNameById = useMemo(() => new Map(entities.map((entity) => [entity.id, entity.name])), [entities]);

  const visibleEntries = useMemo(() => {
    return entries
      .filter((item) => filterMood === "ALL" || item.mood === filterMood)
      .filter((item) => filterEntityId === "ALL" || item.entityId === filterEntityId);
  }, [entries, filterMood, filterEntityId]);

  async function createEntry() {
    if (!title.trim() || !entryBody.trim()) {
      return;
    }

    setSaving(true);

    const payload: CreateJournalEntryInput = {
      title: title.trim(),
      entry: entryBody.trim(),
      date,
      mood,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      entityId: entityId || undefined,
      energyScore,
      focusScore,
    };

    const response = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const created = (await response.json()) as JournalEntry;
      setEntries((current) => [created, ...current]);
      setTitle("");
      setEntryBody("");
      setTagsInput("");
      setMood("NEUTRAL");
      setEnergyScore(7);
      setFocusScore(7);
      setDate(new Date().toISOString().slice(0, 10));
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-5">
          <h2 className="mb-3 text-base font-semibold text-white">Quick Journal Capture</h2>
          <div className="space-y-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="Entry title"
            />
            <textarea
              value={entryBody}
              onChange={(event) => setEntryBody(event.currentTarget.value)}
              className="min-h-28 w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="What happened? What did you learn?"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.currentTarget.value)}
                className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              />
              <select
                value={mood}
                onChange={(event) => setMood(event.currentTarget.value as JournalEntry["mood"])}
                className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              >
                <option value="GREAT">GREAT</option>
                <option value="GOOD">GOOD</option>
                <option value="NEUTRAL">NEUTRAL</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="Tags (comma separated)"
            />

            <select
              value={entityId}
              onChange={(event) => setEntityId(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <label className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-xs text-white/80">
                Energy: {energyScore}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energyScore}
                  onChange={(event) => setEnergyScore(Number(event.currentTarget.value))}
                  className="mt-1 w-full"
                />
              </label>
              <label className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-xs text-white/80">
                Focus: {focusScore}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={focusScore}
                  onChange={(event) => setFocusScore(Number(event.currentTarget.value))}
                  className="mt-1 w-full"
                />
              </label>
            </div>

            <Button className="w-full" disabled={saving} onClick={() => void createEntry()}>
              {saving ? "Saving..." : "Save Journal Entry"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">Journal Timeline</h2>
            <p className="text-xs text-white/65">{visibleEntries.length} entries</p>
          </div>

          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <select
              value={filterMood}
              onChange={(event) => setFilterMood(event.currentTarget.value as MoodFilter)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            >
              <option value="ALL">All moods</option>
              <option value="GREAT">Great</option>
              <option value="GOOD">Good</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filterEntityId}
              onChange={(event) => setFilterEntityId(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            >
              <option value="ALL">All entities</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {visibleEntries.length === 0 ? (
              <p className="rounded-xl border border-emerald-300/50 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
                No entries for this filter.
              </p>
            ) : (
              visibleEntries.map((item) => {
                const energy = scoreTone(item.energyScore);
                const focus = scoreTone(item.focusScore);

                return (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${moodClasses(item.mood)}`}>
                        {item.mood}
                      </span>
                    </div>

                    <p className="text-sm text-white/85">{item.entry}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {formatDate(item.date)} · {item.entityId ? entityNameById.get(item.entityId) ?? "Unknown" : "No entity"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={`${item.id}-${tag}`} className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[11px] text-white/75">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className={`rounded-lg border px-2 py-1 text-xs ${energy.panel} ${energy.text}`}>
                        <div className="mb-1 flex items-center justify-between">
                          <span>Energy {item.energyScore ?? "-"}/10</span>
                          <span className={`inline-block h-2 w-10 rounded-full ${energy.bar}`} />
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full rounded-full ${energy.bar}`} style={{ width: energy.width }} />
                        </div>
                      </div>

                      <div className={`rounded-lg border px-2 py-1 text-xs ${focus.panel} ${focus.text}`}>
                        <div className="mb-1 flex items-center justify-between">
                          <span>Focus {item.focusScore ?? "-"}/10</span>
                          <span className={`inline-block h-2 w-10 rounded-full ${focus.bar}`} />
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full rounded-full ${focus.bar}`} style={{ width: focus.width }} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
