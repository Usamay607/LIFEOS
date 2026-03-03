import type { Task } from "@los/types";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getTaskTrackState, trackBarClass, trackToneClass } from "@/lib/track";

export function NextActionsCard({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="lg:col-span-6">
      <CardHeader>
        <CardTitle>Next Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className={`mb-2 flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${trackToneClass(getTaskTrackState(task))}`}>
                <span>{getTaskTrackState(task).replace("_", " ")}</span>
                <span className={`inline-block h-2.5 w-12 rounded-full ${trackBarClass(getTaskTrackState(task))}`} />
              </div>
              <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white">{task.title}</p>
                <p className="text-xs text-white/60">Due {formatDate(task.dueDate)} · {task.context.toLowerCase()}</p>
              </div>
              <StatusPill value={task.status} />
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
