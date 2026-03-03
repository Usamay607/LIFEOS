import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const [overview, logs, workouts] = await Promise.all([
    losService.getHealthOverview(),
    losService.listHealthLogs(14),
    losService.listWorkouts(14),
  ]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Health + Training"
        subtitle="Recovery, training volume, and weekly trend visibility with focus on consistency."
      />

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Weekly Biometrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Avg Steps</p>
                <p className="text-xl font-semibold text-white">{Math.round(overview.weeklyAverages.steps).toLocaleString("en-AU")}</p>
                <p className={`text-xs ${overview.trend.stepsDelta >= 0 ? "text-emerald-200" : "text-rose-200"}`}>Δ {overview.trend.stepsDelta.toFixed(0)} vs prior week</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Avg Sleep</p>
                <p className="text-xl font-semibold text-white">{overview.weeklyAverages.sleepHours}h</p>
                <p className={`text-xs ${overview.trend.sleepDelta >= 0 ? "text-emerald-200" : "text-rose-200"}`}>Δ {overview.trend.sleepDelta.toFixed(1)}h</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Recovery</p>
                <p className="text-xl font-semibold text-white">{overview.weeklyAverages.recoveryScore}</p>
                <p className={`text-xs ${overview.trend.recoveryDelta >= 0 ? "text-emerald-200" : "text-rose-200"}`}>Δ {overview.trend.recoveryDelta.toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Workouts</p>
                <p className="text-xl font-semibold text-white">{overview.workoutsThisWeek}</p>
                <p className="text-xs text-white/60">in trailing week</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Training Minutes</p>
                <p className="text-xl font-semibold text-white">{overview.trainingMinutesThisWeek}</p>
                <p className="text-xs text-white/60">in trailing week</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Hydration</p>
                <p className="text-xl font-semibold text-white">{overview.weeklyAverages.hydrationLiters}L</p>
                <p className="text-xs text-white/60">avg daily</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Training Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-white/85">
              {Object.entries(overview.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p>{type}</p>
                  <p>{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workouts.slice(0, 6).map((workout) => (
                <div key={workout.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                  <p className="font-medium text-white">{workout.sessionType} · {workout.intensity}</p>
                  <p className="text-xs text-white/65">{formatDate(workout.date)} · {workout.durationMinutes} mins</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Daily Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                  <p className="font-medium text-white">{formatDate(log.date)} · Recovery {log.recoveryScore}</p>
                  <p className="text-xs text-white/65">
                    Steps {log.steps.toLocaleString("en-AU")} · Sleep {log.sleepHours}h · RHR {log.restingHeartRate}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
