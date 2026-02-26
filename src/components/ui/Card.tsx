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
      className={`game-card p-4 ${className}`}
      style={glowColor ? { borderLeft: `4px solid ${glowColor}` } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-xs font-bold uppercase tracking-wider text-muted mb-3 ${className}`}>
      {children}
    </div>
  );
}
