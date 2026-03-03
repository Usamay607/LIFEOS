import type { Project } from "@los/types";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getProjectTrackState, trackBarClass, trackToneClass } from "@/lib/track";

export function ProjectPulseCard({ projects }: { projects: Project[] }) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Project Pulse</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className={`mb-2 flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${trackToneClass(getProjectTrackState(project))}`}>
                <span>{getProjectTrackState(project).replace("_", " ")}</span>
                <span className={`inline-block h-2.5 w-12 rounded-full ${trackBarClass(getProjectTrackState(project))}`} />
              </div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-white">{project.name}</h3>
                <StatusPill value={project.status} />
              </div>
              <p className="text-xs text-white/70">Next: {project.nextMilestone ?? "No milestone set"}</p>
              <p className="mt-1 text-xs text-white/55">Deadline: {formatDate(project.deadline)}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
