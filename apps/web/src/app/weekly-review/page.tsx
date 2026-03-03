import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { WeeklyReviewWorkspace } from "@/components/weekly-review-workspace";

export const dynamic = "force-dynamic";

export default async function WeeklyReviewPage() {
  const dashboard = await losService.getHomeDashboard();

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Weekly Review"
        subtitle="Reset loop: capture wins, clear stalled items, and prepare the next week in under 20 minutes."
      />

      <WeeklyReviewWorkspace dashboard={dashboard} />
    </main>
  );
}
