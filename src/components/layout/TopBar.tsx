'use client';
import { useProfileStore } from '@/lib/stores/profileStore';
import { useEffect } from 'react';

export function TopBar() {
  const { profile, load } = useProfileStore();

  useEffect(() => { load(); }, [load]);

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpForNext = level * 100;
  const xpPercent = Math.min((xp / xpForNext) * 100, 100);

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d24]/90 backdrop-blur-sm border-b border-card-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-lg">{profile?.avatar || '🎮'}</span>
          <div>
            <div className="font-[family-name:var(--font-pixel)] text-[10px] text-accent-gold">
              LVL {level}
            </div>
            <div className="text-xs text-muted">{profile?.name || 'Player'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] text-accent-green font-mono">{xp} XP</div>
            <div className="w-20 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
