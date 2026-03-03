import type { LearningOverview } from "@los/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function toneForPercent(value: number) {
  if (value >= 70) {
    return {
      panel: "border-emerald-300/60 bg-emerald-300/15",
      bar: "bg-emerald-300",
    };
  }
  if (value >= 45) {
    return {
      panel: "border-amber-300/60 bg-amber-300/15",
      bar: "bg-amber-300",
    };
  }
  return {
    panel: "border-rose-300/70 bg-rose-300/20",
    bar: "bg-rose-300",
  };
}

export function LearningPulseCard({ overview }: { overview: LearningOverview }) {
  const impact = toneForPercent(overview.impactScore);
  const atRiskCount = overview.upcomingCourseDeadlines.filter((course) => course.atRisk).length;

  return (
    <Card className="lg:col-span-6">
      <CardHeader>
        <CardTitle>Learning + Certifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`rounded-xl border p-3 ${impact.panel}`}>
            <p className="text-xs uppercase tracking-[0.08em] text-white/70">Impact Score</p>
            <p className="mt-1 text-2xl font-semibold text-white">{overview.impactScore.toFixed(0)}%</p>
            <span className={`mt-2 inline-block h-2.5 w-20 rounded-full ${impact.bar}`} />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Deadlines</p>
            <p className="mt-1 text-lg font-semibold text-white">{overview.upcomingCourseDeadlines.length} upcoming</p>
            <p className="text-xs text-white/75">{atRiskCount} at risk</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {overview.activePathways.slice(0, 2).map((pathway) => {
            const tone = toneForPercent(pathway.progressPercent);
            return (
              <div key={pathway.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium text-white">{pathway.title}</p>
                  <p className="text-xs text-white/70">{pathway.progressPercent}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pathway.progressPercent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
