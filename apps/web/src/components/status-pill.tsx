import { cn } from "@/lib/cn";

const STATUS_STYLE = {
  ACTIVE: "border-emerald-300/80 bg-emerald-300/20 text-emerald-100",
  ON_HOLD: "border-slate-300/60 bg-slate-300/20 text-slate-100",
  CEASED: "border-zinc-400/60 bg-zinc-400/20 text-zinc-100",
  NEXT: "border-orange-300/80 bg-orange-300/20 text-orange-100",
  DOING: "border-blue-300/80 bg-blue-300/20 text-blue-100",
  WAITING: "border-amber-300/80 bg-amber-300/20 text-amber-100",
  DONE: "border-teal-300/80 bg-teal-300/20 text-teal-100",
} as const;

export function StatusPill({ value }: { value: keyof typeof STATUS_STYLE }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        STATUS_STYLE[value],
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}
