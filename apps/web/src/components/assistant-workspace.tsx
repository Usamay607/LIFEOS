"use client";

import { useState } from "react";
import type { AssistantQueryResponse, RedactionLevel } from "@los/types";
import { Button } from "@/components/ui/button";

export function AssistantWorkspace() {
  const [question, setQuestion] = useState("");
  const [redactionLevel, setRedactionLevel] = useState<RedactionLevel>("STRICT");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitQuery() {
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/assistant/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question.trim(), redactionLevel }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Assistant request failed");
      setResult(null);
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as AssistantQueryResponse;
    setResult(payload);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <h2 className="mb-2 text-base font-semibold text-white">Ask LOS Assistant</h2>
        <p className="mb-3 text-sm text-white/70">
          Read-only analysis on bottlenecks, priorities, and momentum. No credential or vault data is exposed.
        </p>

        <textarea
          value={question}
          onChange={(event) => setQuestion(event.currentTarget.value)}
          className="min-h-28 w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
          placeholder="Example: What is the biggest bottleneck in my week and what should I do first tomorrow?"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant={redactionLevel === "STRICT" ? "solid" : "ghost"}
            onClick={() => setRedactionLevel("STRICT")}
          >
            Strict Redaction
          </Button>
          <Button
            variant={redactionLevel === "STANDARD" ? "solid" : "ghost"}
            onClick={() => setRedactionLevel("STANDARD")}
          >
            Standard Redaction
          </Button>
          <Button className="ml-auto" disabled={loading || !question.trim()} onClick={() => void submitQuery()}>
            {loading ? "Analyzing..." : "Ask Assistant"}
          </Button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300/60 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white/75">Assistant Response</h3>
            <p className="text-xs text-white/60">Redaction: {result.redactionApplied}</p>
          </div>
          <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/35 p-3 text-sm text-white/85">
            {result.answer}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
