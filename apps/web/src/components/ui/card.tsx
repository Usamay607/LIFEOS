import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  className?: string;
}

export function Card({ className, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={cn("los-card relative overflow-hidden", className)}>
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      {children}
    </section>
  );
}

export function CardHeader({ className, children }: PropsWithChildren<CardProps>) {
  return <header className={cn("mb-4 flex items-start justify-between", className)}>{children}</header>;
}

export function CardTitle({ className, children }: PropsWithChildren<CardProps>) {
  return <h2 className={cn("text-sm font-semibold tracking-[0.01em] text-white/90", className)}>{children}</h2>;
}

export function CardContent({ className, children }: PropsWithChildren<CardProps>) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
