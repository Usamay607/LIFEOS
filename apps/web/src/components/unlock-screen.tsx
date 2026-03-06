"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type UnlockScreenProps = {
  locked: boolean;
  nextPath: string;
};

export function UnlockScreen({ locked, nextPath }: UnlockScreenProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : NaN;
        const retryMinutes = Number.isFinite(retryAfter) ? Math.max(1, Math.ceil(retryAfter / 60)) : null;
        setError(
          retryMinutes
            ? `Too many attempts. Try again in about ${retryMinutes} minute(s).`
            : "Too many attempts. Please try again shortly.",
        );
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error?.trim() ? payload.error : "Invalid PIN");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_top,rgba(49,210,255,0.22),transparent_38%),linear-gradient(160deg,rgba(7,16,30,0.92),rgba(7,16,30,0.54))] p-7 shadow-[0_24px_70px_rgba(2,8,20,0.52)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-50">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private dashboard
            </div>
            <h1 className="mt-5 max-w-md text-4xl font-semibold tracking-tight text-white md:text-5xl">Unlock LOS</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-cyan-50/72 md:text-base">
              One PIN gets you back into your command center. After unlock, LOS returns you to the page you were trying to open.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Access</p>
                <p className="mt-2 text-lg font-semibold text-white">Fast re-entry</p>
                <p className="mt-1 text-sm text-white/65">Protected at the app layer without exposing the main dashboard UI.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Redirect</p>
                <p className="mt-2 text-lg font-semibold text-white">No lost context</p>
                <p className="mt-1 text-sm text-white/65">If you opened a specific module first, LOS will return you there after unlock.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/12 bg-[linear-gradient(170deg,rgba(12,24,40,0.88),rgba(7,14,26,0.72))] p-7 shadow-[0_24px_70px_rgba(2,8,20,0.5)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/52">Secure entry</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Enter PIN</h2>
            <p className="mt-2 text-sm text-white/65">Use your dashboard PIN to continue.</p>

            {locked ? (
              <p className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                Dashboard locked. Enter your PIN to continue.
              </p>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-white/48" htmlFor="los-pin">
                  PIN
                </label>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/14 bg-slate-950/45 px-4 py-3 text-lg tracking-[0.18em] text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
                  id="los-pin"
                  inputMode="numeric"
                  onChange={(event) => setPin(event.currentTarget.value)}
                  placeholder="••••"
                  type="password"
                  value={pin}
                />
              </div>

              <Button className="w-full py-3 text-base" disabled={submitting} type="submit">
                {submitting ? "Checking..." : "Unlock"}
              </Button>
            </form>

            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
