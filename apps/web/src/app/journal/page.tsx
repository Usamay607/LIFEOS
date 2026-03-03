import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { JournalWorkspace } from "@/components/journal-workspace";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const [entries, entities] = await Promise.all([losService.listJournalEntries(), losService.listEntities(false)]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Journal"
        subtitle="Capture reflections, decisions, and lessons in one place with mood and focus signals."
      />
      <JournalWorkspace initialEntries={entries} entities={entities} />
    </main>
  );
}
