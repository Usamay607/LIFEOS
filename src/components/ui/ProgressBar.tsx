'use client';

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, color = 'var(--accent-green)', height = 8, showLabel = false, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>{label}</span>
          <span className="font-semibold">{clamped}%</span>
        </div>
      )}
      <div className="xp-bar" style={{ height }}>
        <div className="xp-bar-fill" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
