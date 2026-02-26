import { create } from 'zustand';
import { db } from '../db';
import type { DailyCheckin } from '../types';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CheckinStore {
  today: DailyCheckin | null;
  loading: boolean;
  load: () => Promise<void>;
  save: (data: Partial<DailyCheckin>) => Promise<void>;
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  today: null,
  loading: true,

  load: async () => {
    const today = await db.dailyCheckins.where('date').equals(todayKey()).first() || null;
    set({ today, loading: false });
  },

  save: async (data) => {
    const date = todayKey();
    const existing = await db.dailyCheckins.where('date').equals(date).first();
    if (existing?.id) {
      await db.dailyCheckins.update(existing.id, data);
    } else {
      await db.dailyCheckins.add({
        date,
        energy: 3,
        focus: 3,
        top3: [],
        startup: '',
        shutdown: '',
        notes: '',
        createdAt: new Date(),
        ...data,
      });
    }
    get().load();
  },
}));
