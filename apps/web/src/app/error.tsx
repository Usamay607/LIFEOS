"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl space-y-4 py-8">
      <section className="rounded-2xl border border-rose-300/50 bg-rose-300/10 p-5">
        <p className="text-xs uppercase tracking-[0.08em] text-rose-100/90">Something went wrong</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Unexpected runtime error</h1>
        <p className="mt-2 text-sm text-white/80">Try resetting the page. If the issue persists, return to Home and continue from another module.</p>

        <div className="mt-4 flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/" className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            Back Home
          </Link>
        </div>
      </section>
    </main>
  );
}
