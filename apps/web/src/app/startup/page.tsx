import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";

function statusTone(ok: boolean) {
  return ok
    ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
    : "border-rose-300/60 bg-rose-300/15 text-rose-100";
}

export default async function StartupPage() {
  const readiness = await losService.getSystemReadiness();
  const dashboardPinConfigured = Boolean(process.env.LOS_DASHBOARD_PIN?.trim());

  const blockers: string[] = [];
  if (readiness.dataMode === "notion" && !readiness.notionTokenConfigured) {
    blockers.push("Set NOTION_TOKEN in your environment.");
  }
  if (readiness.dataMode === "notion" && readiness.missingDatabases.length > 0) {
    blockers.push(`Add missing Notion DB IDs: ${readiness.missingDatabases.join(", ")}.`);
  }
  if (!dashboardPinConfigured) {
    blockers.push("Set LOS_DASHBOARD_PIN for basic dashboard access control.");
  }

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Startup Hub"
        subtitle="Operational launch board to get LOS running quickly and safely."
      />

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <article className={`rounded-xl border px-3 py-2 ${statusTone(readiness.startupReady)}`}>
          <p className="text-xs uppercase tracking-[0.08em]">System Status</p>
          <p className="mt-1 text-lg font-semibold">{readiness.startupReady ? "Ready" : "Needs Setup"}</p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85">
          <p className="text-xs uppercase tracking-[0.08em] text-white/65">Data Mode</p>
          <p className="mt-1 text-lg font-semibold text-white">{readiness.dataMode.toUpperCase()}</p>
        </article>

        <article className={`rounded-xl border px-3 py-2 ${statusTone(readiness.connectivity === "ok" || readiness.connectivity === "skipped")}`}>
          <p className="text-xs uppercase tracking-[0.08em]">Data Connectivity</p>
          <p className="mt-1 text-lg font-semibold">{readiness.connectivity.toUpperCase()}</p>
        </article>

        <article className={`rounded-xl border px-3 py-2 ${statusTone(dashboardPinConfigured)}`}>
          <p className="text-xs uppercase tracking-[0.08em]">Dashboard PIN</p>
          <p className="mt-1 text-lg font-semibold">{dashboardPinConfigured ? "Configured" : "Missing"}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <h2 className="mb-2 text-base font-semibold text-white">Readiness Details</h2>
          <div className="space-y-2 text-sm text-white/85">
            <p>Notion token: {readiness.notionTokenConfigured ? "configured" : "missing"}</p>
            <p>OpenAI key: {readiness.openAiConfigured ? "configured" : "missing (optional)"}</p>
            <p>
              Database IDs: {readiness.configuredDatabases}/{readiness.requiredDatabasesTotal}
            </p>
            <p>
              Data counts: {readiness.dataCounts.entities} entities, {readiness.dataCounts.projects} projects, {readiness.dataCounts.tasks} tasks, {readiness.dataCounts.journalEntries} journal entries
            </p>
            {readiness.connectivityError ? (
              <p className="rounded-lg border border-rose-300/60 bg-rose-300/10 px-2 py-1 text-rose-100">{readiness.connectivityError}</p>
            ) : null}
          </div>

          {readiness.missingDatabases.length > 0 ? (
            <div className="mt-3 rounded-xl border border-amber-300/60 bg-amber-300/10 p-2 text-sm text-amber-100">
              Missing DB IDs: {readiness.missingDatabases.join(", ")}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <h2 className="mb-2 text-base font-semibold text-white">Go-Live Checklist</h2>
          {blockers.length === 0 ? (
            <p className="rounded-xl border border-emerald-300/60 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
              No blockers detected. You can start using LOS now.
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-white/85">
              {blockers.map((blocker) => (
                <li key={blocker} className="rounded-xl border border-rose-300/60 bg-rose-300/10 px-3 py-2 text-rose-100">
                  {blocker}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 space-y-2">
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Operational commands</p>
            <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/35 p-2 text-xs text-white/80">
{`pnpm install
cp .env.example .env
pnpm dev
pnpm typecheck && pnpm test && pnpm --filter @los/web build`}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
