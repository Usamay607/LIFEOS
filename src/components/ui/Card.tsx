'use client';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function Card({ children, className = '', glowColor }: CardProps) {
  return (
    <div
      className={`glow-card p-4 ${className}`}
      style={glowColor ? { borderColor: glowColor, boxShadow: `0 0 12px ${glowColor}20` } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`font-[family-name:var(--font-pixel)] text-[10px] uppercase tracking-wider text-muted mb-3 ${className}`}>{children}</div>;
}
