import Link from "next/link";
import { ClipboardCheck, FolderKanban, NotebookPen, Target } from "lucide-react";

const ACTIONS = [
  { href: "/focus", label: "Focus", Icon: Target, tone: "border-emerald-300/60 bg-emerald-300/10 text-emerald-100" },
  { href: "/projects", label: "Projects", Icon: FolderKanban, tone: "border-amber-300/60 bg-amber-300/10 text-amber-100" },
  { href: "/journal", label: "Journal", Icon: NotebookPen, tone: "border-cyan-300/60 bg-cyan-300/10 text-cyan-100" },
  { href: "/weekly-review", label: "Review", Icon: ClipboardCheck, tone: "border-white/20 bg-white/5 text-white" },
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
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-sm font-semibold transition hover:opacity-90 ${action.tone}`}
          >
            <action.Icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
