"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { LockButton } from "@/components/lock-button";

type AppShellProps = {
  children: ReactNode;
  melbourneDate: string;
};

export function AppShell({ children, melbourneDate }: AppShellProps) {
  const pathname = usePathname();
  const hideChrome = pathname === "/unlock";

  if (hideChrome) {
    return children;
  }

  return (
    <div className="los-shell">
      <header className="los-topbar">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-100/70">Life Operating System</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">LOS</h1>
          <p className="text-xs text-white/60">{melbourneDate}</p>
        </div>

        <div className="los-topbar-tools">
          <input
            aria-label="Quick search"
            className="los-search-input"
            placeholder="Jump to module or page..."
            type="search"
          />
          <p className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-cyan-50">
            Australia/Melbourne · AUD
          </p>
          <LockButton />
        </div>
      </header>

      <div className="los-workspace">
        <AppNav />
        <div className="los-content">{children}</div>
      </div>
    </div>
  );
}
