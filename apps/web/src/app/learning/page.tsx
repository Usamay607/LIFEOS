import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function barClass(percent: number) {
  if (percent >= 70) {
    return "bg-emerald-300";
  }
  if (percent >= 45) {
    return "bg-amber-300";
  }
  return "bg-rose-300";
}

export default async function LearningPage() {
  const [overview, pathways, courses] = await Promise.all([
    losService.getLearningOverview(),
    losService.listPathways(),
    losService.listCourses(),
  ]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Learning + Certifications"
        subtitle="Track pathway progress, certification deadlines, and real-world application in active projects."
      />

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Impact Pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/65">Learning Impact Score</p>
              <p className="text-3xl font-semibold text-white">{overview.impactScore.toFixed(0)}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${barClass(overview.impactScore)}`} style={{ width: `${overview.impactScore}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Active Pathways</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.activePathways.map((pathway) => (
                <article key={pathway.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm text-white">
                    <p className="font-medium">{pathway.title}</p>
                    <p>{pathway.progressPercent}%</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${barClass(pathway.progressPercent)}`} style={{ width: `${pathway.progressPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/65">
                    {pathway.coursesInProgress} / {pathway.totalCourses} courses in progress or complete
                  </p>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Course Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.upcomingCourseDeadlines.length === 0 ? (
                <p className="rounded-xl border border-emerald-300/60 bg-emerald-300/15 px-3 py-2 text-sm text-emerald-100">
                  No upcoming course deadlines right now.
                </p>
              ) : (
                overview.upcomingCourseDeadlines.map((course) => (
                  <div
                    key={course.id}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      course.atRisk
                        ? "border-rose-300/60 bg-rose-300/15 text-rose-100"
                        : "border-emerald-300/60 bg-emerald-300/10 text-emerald-100"
                    }`}
                  >
                    <p className="font-medium text-white">{course.title}</p>
                    <p className="text-xs">
                      Due {formatDate(course.targetDate)} · {course.daysUntilDue} day{course.daysUntilDue === 1 ? "" : "s"} left
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course / Cert Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {courses.map((course) => {
                const estimated = course.estimatedHours ?? 0;
                const completed = course.completedHours ?? 0;
                const progress = estimated > 0 ? Math.min(100, Math.round((completed / estimated) * 100)) : 0;

                return (
                  <article key={course.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/85">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-medium text-white">{course.title}</p>
                      <p className="text-xs text-white/65">{course.status.replace("_", " ")}</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${barClass(progress)}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-white/65">
                      {completed}h / {estimated}h · Applied progress {course.appliedProgressPercent}%
                    </p>
                  </article>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>All Pathways</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {pathways.map((pathway) => (
              <div key={pathway.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                <p className="font-medium text-white">{pathway.title}</p>
                <p className="text-xs text-white/65">{pathway.status} · {pathway.progressPercent}% complete</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
