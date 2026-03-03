import Link from "next/link";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 py-6">
      <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.1em] text-white/60">Offline Mode</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">You are offline</h1>
        <p className="mt-2 text-sm text-white/75">
          LOS can still open recently cached pages. Reconnect to sync live project, finance, and journal data.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/focus" className="rounded-xl border border-emerald-300/50 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-300/20">
            Open Focus Mode
          </Link>
          <Link href="/journal" className="rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-300/20">
            Open Journal
          </Link>
          <Link href="/projects" className="rounded-xl border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-sm text-amber-100 hover:bg-amber-300/20">
            Open Projects
          </Link>
          <Link href="/" className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
            Back Home
          </Link>
        </div>
      </section>
    </main>
  );
}
