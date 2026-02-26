'use client';
import { useProfileStore } from '@/lib/stores/profileStore';
import { useEffect } from 'react';
import { Flame, Star } from 'lucide-react';

export function TopBar() {
  const { profile, load } = useProfileStore();

  useEffect(() => { load(); }, [load]);

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpForNext = level * 100;
  const xpPercent = Math.min((xp / xpForNext) * 100, 100);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-card-border">
      <div className="flex items-center justify-between px-4 py-2.5 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm shadow-sm">
            {profile?.avatar || '🎮'}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">{profile?.name || 'Player'}</div>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-muted font-medium">Lv.{level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
            <Flame size={12} />
            <span className="text-[11px] font-bold">{xp}</span>
          </div>
          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            <Star size={12} />
            <span className="text-[11px] font-bold">{level}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
