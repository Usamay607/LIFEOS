import type { FamilyOverview } from "@los/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export function FamilyPulseCard({ overview }: { overview: FamilyOverview }) {
  const overdueCount = overview.overdueRelationships.length;

  return (
    <Card className="lg:col-span-6">
      <CardHeader>
        <CardTitle>Family + Relationships</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Upcoming Events</p>
            <div className="mt-2 space-y-2 text-sm text-white/85">
              {overview.upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-2 py-1">
                  <p>{event.title}</p>
                  <p className="text-xs text-white/65">{formatDate(event.date)}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              overdueCount > 0 ? "border-rose-300/60 bg-rose-300/15" : "border-emerald-300/60 bg-emerald-300/10"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-white/70">Relationship Check-ins</p>
            <p className="mt-1 text-lg font-semibold text-white">{overdueCount} overdue</p>
            <p className="text-xs text-white/75">{overview.dueSoonRelationships.length} due soon</p>
            <div className="mt-2 space-y-1 text-xs text-white/80">
              {overview.overdueRelationships.slice(0, 3).map((item) => (
                <p key={item.id}>
                  {item.person}: {item.daysSinceContact}d since contact
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
