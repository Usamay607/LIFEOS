"use client";

import { useState } from "react";
import type { WeeklySummaryResponse } from "@los/types";
import { Button } from "@/components/ui/button";

export function WeeklySummaryPanel() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<WeeklySummaryResponse | null>(null);

  async function generateSummary() {
    setLoading(true);
    const response = await fetch("/api/reviews/weekly-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewDate: new Date().toISOString(),
        taskWindowDays: 7,
        redactionLevel: "STRICT",
      }),
    });

    if (response.ok) {
      const payload = (await response.json()) as WeeklySummaryResponse;
      setSummary(payload);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => void generateSummary()} disabled={loading}>
        {loading ? "Generating..." : "Generate Weekly Summary"}
      </Button>
      {summary ? (
        <pre className="whitespace-pre-wrap rounded-2xl border border-white/15 bg-slate-950/40 p-4 text-sm text-white/85">
          {summary.summary}
        </pre>
      ) : null}
    </div>
  );
}
