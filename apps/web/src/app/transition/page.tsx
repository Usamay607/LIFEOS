import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TransitionPage() {
  const overview = await losService.getTransitionOverview();

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Transition + Time-Off"
        subtitle="Track pre-sabbatical readiness, at-risk milestones, and projected freedom timeline."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness + Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Runway Months</p>
                <p className="text-2xl font-semibold text-white">{overview.runwayMonths.toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/65">Readiness Score</p>
                <p className="text-2xl font-semibold text-white">{overview.readinessScore.toFixed(0)}%</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/80">Projected freedom date: {formatDate(overview.projectedFreedomDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>At-Risk Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.atRiskPlans.length === 0 ? (
                <p className="rounded-xl border border-emerald-300/50 bg-emerald-300/15 px-3 py-2 text-sm text-emerald-100">
                  No at-risk transition plans right now.
                </p>
              ) : (
                overview.atRiskPlans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-rose-300/50 bg-rose-300/15 px-3 py-2 text-sm text-rose-100">
                    <p className="font-medium">{plan.title}</p>
                    <p className="text-xs">Target: {formatDate(plan.targetDate)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pre-Sabbatical Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {overview.preSabbaticalPlans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                <p className="font-medium text-white">{plan.title}</p>
                <p className="text-xs text-white/65">
                  {plan.status} · {formatDate(plan.targetDate)} · AUD {plan.estimatedCostAud.toLocaleString("en-AU")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
