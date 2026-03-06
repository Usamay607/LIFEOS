import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const overview = await losService.getFamilyOverview();
  const peopleNeedingAttention = [...overview.overdueRelationships, ...overview.dueSoonRelationships];

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Family"
        subtitle="Upcoming events first, with people reminders only when they need attention."
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
            <CardTitle>People to Reach Out To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {peopleNeedingAttention.length === 0 ? (
                <p className="rounded-xl border border-emerald-300/50 bg-emerald-300/15 px-3 py-2 text-sm text-emerald-100">
                  Nothing is due right now.
                </p>
              ) : (
                peopleNeedingAttention.map((item) => {
                  const overdue = overview.overdueRelationships.some((row) => row.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        overdue
                          ? "border-rose-300/50 bg-rose-300/15 text-rose-100"
                          : "border-amber-300/50 bg-amber-300/15 text-amber-100"
                      }`}
                    >
                      <p className="font-medium">{item.person}</p>
                      <p className="text-xs">
                        {item.daysSinceContact} days since contact · target {item.targetCadenceDays} days
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
