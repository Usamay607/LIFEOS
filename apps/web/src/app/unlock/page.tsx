"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnlockPage() {
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
        router.push("/");
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
    <main className="mx-auto mt-16 max-w-md rounded-2xl border border-white/20 bg-white/5 p-6">
      <h1 className="text-xl font-semibold text-white">Unlock LOS</h1>
      <p className="mt-1 text-sm text-white/70">Enter dashboard PIN to continue.</p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <input
          type="password"
          value={pin}
          onChange={(event) => setPin(event.currentTarget.value)}
          className="w-full rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2 text-white outline-none focus:border-teal-300"
          placeholder="PIN"
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Checking..." : "Unlock"}
        </Button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </main>
  );
}
