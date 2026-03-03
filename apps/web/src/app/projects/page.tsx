import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { ProjectsWorkspace } from "@/components/projects-workspace";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, tasks, entities] = await Promise.all([
    losService.listProjects(),
    losService.listTasks(),
    losService.listEntities(false),
  ]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Projects + Tasks"
        subtitle="State-driven project lanes with one-screen task execution, deadline risk bars, and quick capture."
      />
      <ProjectsWorkspace initialProjects={projects} initialTasks={tasks} entities={entities} />
    </main>
  );
}
