import type { HealthOverview } from "@los/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HealthPulseCard({ overview }: { overview: HealthOverview }) {
  const latest = overview.latestLog;
  const recovery = latest?.recoveryScore ?? 0;
  const recoveryClass =
    recovery >= 75 ? "border-emerald-300/50 bg-emerald-300/15" : recovery >= 65 ? "border-amber-300/50 bg-amber-300/15" : "border-rose-300/60 bg-rose-300/20";

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Health Pulse</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className={`rounded-xl border p-3 ${recoveryClass}`}>
            <p className="text-xs uppercase tracking-[0.08em] text-white/70">Recovery Score</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-100">{latest?.recoveryScore ?? 0}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-white/65">Sleep</p>
              <p className="font-semibold text-white">{overview.weeklyAverages.sleepHours}h</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-white/65">Steps</p>
              <p className="font-semibold text-white">{Math.round(overview.weeklyAverages.steps).toLocaleString("en-AU")}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white/75">
            <p>Workouts this week: {overview.workoutsThisWeek}</p>
            <p>Training mins: {overview.trainingMinutesThisWeek}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
