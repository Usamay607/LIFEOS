'use client';
import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const VARIANTS = {
  primary: 'bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/30',
  secondary: 'bg-card border border-card-border text-foreground hover:border-muted',
  ghost: 'text-muted hover:text-foreground hover:bg-card',
  danger: 'bg-accent-red/20 text-accent-red border border-accent-red/30 hover:bg-accent-red/30',
};

export function Button({ variant = 'secondary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <button className={`rounded-lg transition-colors ${VARIANTS[variant]} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
