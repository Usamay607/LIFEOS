import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { EntityManager } from "@/components/entity-manager";

export const dynamic = "force-dynamic";

export default async function EntitySettingsPage() {
  const [entities, areas] = await Promise.all([losService.listEntities(true), losService.listAreas(true)]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Entity Manager"
        subtitle="Edit-safe control panel for renaming, archiving, and maintaining your LOS starter pack."
      />
      <EntityManager initialEntities={entities} areas={areas} />
    </main>
  );
}
