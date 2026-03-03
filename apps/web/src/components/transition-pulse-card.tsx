import type { TransitionOverview } from "@los/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export function TransitionPulseCard({ overview }: { overview: TransitionOverview }) {
  const readiness = overview.readinessScore;
  const readinessClass =
    readiness >= 70
      ? "border-emerald-300/60 bg-emerald-300/15"
      : readiness >= 45
        ? "border-amber-300/60 bg-amber-300/15"
        : "border-rose-300/60 bg-rose-300/20";

  return (
    <Card className="lg:col-span-6">
      <CardHeader>
        <CardTitle>Transition / Time-Off</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`rounded-xl border p-3 ${readinessClass}`}>
            <p className="text-xs uppercase tracking-[0.08em] text-white/70">Readiness Score</p>
            <p className="mt-1 text-2xl font-semibold text-white">{readiness.toFixed(0)}%</p>
            <p className="text-xs text-white/80">Projected freedom: {formatDate(overview.projectedFreedomDate)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">At-Risk Plans</p>
            <p className="mt-1 text-lg font-semibold text-white">{overview.atRiskPlans.length}</p>
            <div className="mt-2 space-y-1 text-xs text-white/80">
              {overview.atRiskPlans.slice(0, 2).map((plan) => (
                <p key={plan.id}>{plan.title}</p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
