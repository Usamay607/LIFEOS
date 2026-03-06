import type { FamilyOverview } from "@los/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export function FamilyPulseCard({ overview }: { overview: FamilyOverview }) {
  const peopleNeedingAttention = [...overview.overdueRelationships, ...overview.dueSoonRelationships].slice(0, 4);
  const attentionCount = overview.overdueRelationships.length + overview.dueSoonRelationships.length;

  return (
    <Card className="lg:col-span-6">
      <CardHeader>
        <div>
          <CardTitle>Family</CardTitle>
          <p className="mt-1 text-xs text-white/60">
            {overview.upcomingEvents.length} upcoming · {attentionCount} people to reach out to
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Upcoming Events</p>
            {overview.upcomingEvents.length > 0 ? (
              <div className="mt-2 space-y-2 text-sm text-white/85">
                {overview.upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-2 py-1">
                    <div>
                      <p>{event.title}</p>
                      <p className="text-xs text-white/55">{event.category}</p>
                    </div>
                    <p className="text-xs text-white/65">{formatDate(event.date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/55">No family events scheduled yet.</p>
            )}
          </div>

          <div
            className={`rounded-xl border p-3 ${
              attentionCount > 0 ? "border-amber-300/60 bg-amber-300/12" : "border-emerald-300/60 bg-emerald-300/10"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-white/70">People Reminders</p>
            {attentionCount > 0 ? (
              <>
                <p className="mt-1 text-lg font-semibold text-white">{attentionCount} need attention</p>
                <div className="mt-2 space-y-2 text-xs text-white/85">
                  {peopleNeedingAttention.map((item) => {
                    const overdue = overview.overdueRelationships.some((row) => row.id === item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/20 px-2 py-1.5">
                        <div>
                          <p className="text-sm text-white">{item.person}</p>
                          <p className="text-[11px] text-white/60">{item.daysSinceContact} days since contact</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                            overdue ? "bg-rose-300/20 text-rose-100" : "bg-amber-300/20 text-amber-100"
                          }`}
                        >
                          {overdue ? "Overdue" : "Soon"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-emerald-100">No people reminders due right now.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
