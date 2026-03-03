import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { FocusWorkspace } from "@/components/focus-workspace";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const dashboard = await losService.getHomeDashboard();

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Focus Mode"
        subtitle="Daily execution view: three outcomes, next physical action, and immediate schedule pressure."
      />
      <FocusWorkspace dashboard={dashboard} />
    </main>
  );
}
