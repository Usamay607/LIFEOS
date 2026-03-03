import { SectionHeader } from "@/components/section-header";
import { AssistantWorkspace } from "@/components/assistant-workspace";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <main className="space-y-4">
      <SectionHeader
        title="LOS Assistant"
        subtitle="Read-only coaching and prioritization from your current LOS data with redaction controls."
      />
      <AssistantWorkspace />
    </main>
  );
}
