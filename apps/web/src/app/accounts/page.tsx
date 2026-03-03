import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { AccountsVaultManager } from "@/components/accounts-vault-manager";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, entities] = await Promise.all([
    losService.listAccountReferences("STRICT"),
    losService.listEntities(true),
  ]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Accounts + Vault Hub"
        subtitle="Identity layer for all services by entity, with redaction-first views and credential hygiene tracking."
      />
      <AccountsVaultManager initialAccounts={accounts} entities={entities} />
    </main>
  );
}
