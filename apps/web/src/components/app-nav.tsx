"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  Building2,
  ClipboardCheck,
  Database,
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  Home,
  NotebookPen,
  KeyRound,
  PlaneTakeoff,
  Rocket,
  Target,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

const CORE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/focus", label: "Focus", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/weekly-review", label: "Review", icon: ClipboardCheck },
  { href: "/journal", label: "Journal", icon: NotebookPen },
];

const MODULE_NAV: NavItem[] = [
  { href: "/startup", label: "Startup", icon: Rocket },
  { href: "/launch-checklist", label: "Launch", icon: ClipboardCheck },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/accounts", label: "Accounts", icon: KeyRound },
  { href: "/family", label: "Family", icon: HeartHandshake },
  { href: "/health", label: "Health", icon: Activity },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/transition", label: "Transition", icon: PlaneTakeoff },
  { href: "/settings/data", label: "Data Studio", icon: Database },
  { href: "/settings/entities", label: "Entities", icon: Building2 },
];

function isActivePath(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function NavLink({ currentPath, item }: { currentPath: string; item: NavItem }) {
  const active = isActivePath(currentPath, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-cyan-300/70 bg-gradient-to-r from-cyan-300/25 to-teal-300/15 text-cyan-50 shadow-[0_8px_20px_rgba(45,212,191,0.2)]"
          : "border-white/15 bg-white/[0.03] text-white/80 hover:border-white/25 hover:bg-white/[0.08]",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppNav() {
  const currentPath = usePathname();

  return (
    <>
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {CORE_NAV.map((item) => (
          <NavLink key={item.href} currentPath={currentPath} item={item} />
        ))}
      </nav>

      <aside className="hidden md:block">
        <div className="los-nav-shell">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Core</p>
          <div className="space-y-2">
            {CORE_NAV.map((item) => (
              <NavLink key={item.href} currentPath={currentPath} item={item} />
            ))}
          </div>

          <div className="my-4 h-px bg-white/10" />

          <details className="group">
            <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60 marker:content-none">
              Modules
            </summary>
            <div className="mt-2 space-y-2">
              {MODULE_NAV.map((item) => (
                <NavLink key={item.href} currentPath={currentPath} item={item} />
              ))}
            </div>
          </details>
        </div>
      </aside>
    </>
  );
}
