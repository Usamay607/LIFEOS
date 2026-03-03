import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const overview = await losService.getFamilyOverview();

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Family + Events"
        subtitle="Keep relationships warm and key milestones visible with clear overdue/due-soon signals."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-xs text-white/65">
                    {event.category} · {formatDate(event.date)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Relationship Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.overdueRelationships.length === 0 ? (
                <p className="rounded-xl border border-emerald-300/50 bg-emerald-300/15 px-3 py-2 text-sm text-emerald-100">
                  You are on track with relationship cadence.
                </p>
              ) : (
                overview.overdueRelationships.map((item) => (
                  <div key={item.id} className="rounded-xl border border-rose-300/50 bg-rose-300/15 px-3 py-2 text-sm text-rose-100">
                    <p className="font-medium">{item.person}</p>
                    <p className="text-xs">{item.daysSinceContact} days since contact · target {item.targetCadenceDays} days</p>
                  </div>
                ))
              )}
            </div>

            {overview.dueSoonRelationships.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs uppercase tracking-[0.08em] text-amber-100">Due soon</p>
                {overview.dueSoonRelationships.map((item) => (
                  <div key={item.id} className="rounded-xl border border-amber-300/60 bg-amber-300/15 px-3 py-2 text-sm text-amber-100">
                    {item.person}: {item.daysSinceContact} days since contact
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
