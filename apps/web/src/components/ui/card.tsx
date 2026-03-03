import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  className?: string;
}

export function Card({ className, children }: PropsWithChildren<CardProps>) {
  return <section className={cn("los-card", className)}>{children}</section>;
}

export function CardHeader({ className, children }: PropsWithChildren<CardProps>) {
  return <header className={cn("mb-4 flex items-start justify-between", className)}>{children}</header>;
}

export function CardTitle({ className, children }: PropsWithChildren<CardProps>) {
  return <h2 className={cn("text-sm font-semibold uppercase tracking-[0.12em] text-white/80", className)}>{children}</h2>;
}

export function CardContent({ className, children }: PropsWithChildren<CardProps>) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
