'use client';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-accent-green/20 text-accent-green',
  planned: 'bg-accent-blue/20 text-accent-blue',
  blocked: 'bg-accent-red/20 text-accent-red',
  completed: 'bg-accent-gold/20 text-accent-gold',
  archived: 'bg-muted/20 text-muted',
  available: 'bg-accent-cyan/20 text-accent-cyan',
  done: 'bg-accent-green/20 text-accent-green',
  failed: 'bg-accent-red/20 text-accent-red',
  snoozed: 'bg-accent-purple/20 text-accent-purple',
  locked: 'bg-muted/20 text-muted',
  daily: 'bg-accent-cyan/20 text-accent-cyan',
  habit: 'bg-accent-purple/20 text-accent-purple',
  task: 'bg-accent-blue/20 text-accent-blue',
  boss: 'bg-accent-red/20 text-accent-red',
  milestone: 'bg-accent-gold/20 text-accent-gold',
};

export function Badge({ label, className = '' }: { label: string; className?: string }) {
  const color = STATUS_COLORS[label] || 'bg-muted/20 text-muted';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${color} ${className}`}>
      {label}
    </span>
  );
}
