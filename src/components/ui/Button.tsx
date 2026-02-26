'use client';
import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-white border border-card-border text-foreground hover:bg-surface shadow-sm',
  ghost: 'text-muted hover:text-foreground hover:bg-surface',
  danger: 'bg-accent-red text-white hover:opacity-90 shadow-sm',
};

export function Button({ variant = 'secondary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button className={`rounded-xl font-semibold transition-all ${VARIANTS[variant]} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
