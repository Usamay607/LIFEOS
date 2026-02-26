'use client';
import { type ReactNode, useEffect } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { seedDatabase } from '@/lib/seed';

export function Shell({ children }: { children: ReactNode }) {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <TopBar />
      <main className="pb-20 pt-2 px-4 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
