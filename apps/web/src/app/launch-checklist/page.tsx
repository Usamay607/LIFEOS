import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { LaunchReadinessBoard } from "@/components/launch-readiness-board";

export const dynamic = "force-dynamic";

export default async function LaunchChecklistPage() {
  const dashboard = await losService.getHomeDashboard();

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Launch Checklist"
        subtitle="Final production readiness board with automated signals and manual deployment checks."
      />
      <LaunchReadinessBoard dashboard={dashboard} />
    </main>
  );
}
