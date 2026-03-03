import Link from "next/link";

const ACTIONS = [
  { href: "/focus", label: "Focus", tone: "border-emerald-300/60 bg-emerald-300/10 text-emerald-100" },
  { href: "/projects", label: "Projects", tone: "border-amber-300/60 bg-amber-300/10 text-amber-100" },
  { href: "/journal", label: "Journal", tone: "border-cyan-300/60 bg-cyan-300/10 text-cyan-100" },
  { href: "/weekly-review", label: "Review", tone: "border-white/20 bg-white/5 text-white" },
] as const;

export function MobileQuickActions() {
  return (
    <section className="md:hidden">
      <p className="mb-2 text-xs uppercase tracking-[0.08em] text-white/65">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold transition hover:opacity-90 ${action.tone}`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
