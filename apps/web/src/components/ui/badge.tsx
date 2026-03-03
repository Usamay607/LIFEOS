import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/20 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-white/85",
        className,
      )}
    >
      {children}
    </span>
  );
}
