import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl space-y-4 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.1em] text-white/65">404</p>
      <h1 className="text-3xl font-semibold text-white">Page not found</h1>
      <p className="text-sm text-white/75">This route does not exist in LOS. Return to the command center and continue from there.</p>
      <div className="pt-2">
        <Link href="/" className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
          Go to Home
        </Link>
      </div>
    </main>
  );
}
