import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
};

export function Button({ className, children, variant = "solid", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold transition duration-200",
        variant === "solid"
          ? "bg-teal-400 text-slate-950 hover:bg-teal-300"
          : "border border-white/20 bg-white/5 text-white hover:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
