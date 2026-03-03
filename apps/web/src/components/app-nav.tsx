"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string };

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/focus", label: "Focus" },
  { href: "/projects", label: "Projects" },
  { href: "/weekly-review", label: "Weekly Review" },
  { href: "/journal", label: "Journal" },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/startup", label: "Startup" },
  { href: "/launch-checklist", label: "Launch" },
  { href: "/assistant", label: "Assistant" },
  { href: "/accounts", label: "Accounts" },
  { href: "/family", label: "Family" },
  { href: "/health", label: "Health" },
  { href: "/learning", label: "Learning" },
  { href: "/transition", label: "Transition" },
  { href: "/settings/entities", label: "Entity Manager" },
];

function isActivePath(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function findCurrentLabel(currentPath: string): string {
  const all = [...PRIMARY_NAV, ...SECONDARY_NAV];
  const matched = all.find((item) => isActivePath(currentPath, item.href));
  return matched?.label ?? "Module";
}

export function AppNav() {
  const currentPath = usePathname();
  const currentLabel = findCurrentLabel(currentPath);

  return (
    <nav className="mb-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.12em] text-white/60">Navigation</p>
        <p className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.08em] text-white/80">
          Current: {currentLabel}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRIMARY_NAV.map((item) => {
          const active = isActivePath(currentPath, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition",
                active
                  ? "border-teal-300 bg-teal-300/15 text-teal-100"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <details className="rounded-xl border border-white/15 bg-white/5 p-2">
        <summary className="cursor-pointer list-none px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
          More Modules
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {SECONDARY_NAV.map((item) => {
            const active = isActivePath(currentPath, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition",
                  active
                    ? "border-teal-300 bg-teal-300/15 text-teal-100"
                    : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </details>
    </nav>
  );
}
