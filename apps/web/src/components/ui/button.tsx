import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
};

export function Button({ className, children, variant = "solid", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200",
        variant === "solid"
          ? "border border-cyan-200/25 bg-gradient-to-r from-cyan-300 to-teal-300 text-slate-950 shadow-[0_8px_24px_rgba(6,182,212,0.35)] hover:from-cyan-200 hover:to-teal-200"
          : "border border-white/20 bg-white/5 text-white hover:border-white/35 hover:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
