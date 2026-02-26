'use client';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  planned: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  completed: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-500',
  available: 'bg-cyan-100 text-cyan-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  snoozed: 'bg-purple-100 text-purple-700',
  locked: 'bg-gray-100 text-gray-500',
  daily: 'bg-cyan-100 text-cyan-700',
  habit: 'bg-purple-100 text-purple-700',
  task: 'bg-blue-100 text-blue-700',
  boss: 'bg-red-100 text-red-700',
  milestone: 'bg-amber-100 text-amber-700',
};

export function Badge({ label, className = '' }: { label: string; className?: string }) {
  const color = STATUS_COLORS[label] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${color} ${className}`}>
      {label}
    </span>
  );
}
