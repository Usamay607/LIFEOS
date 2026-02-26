import { create } from 'zustand';
import { db } from '../db';
import type { LifeStage } from '../types';

interface StageStore {
  stages: LifeStage[];
  activeStage: LifeStage | null;
  loading: boolean;
  load: () => Promise<void>;
  add: (stage: Omit<LifeStage, 'id' | 'createdAt'>) => Promise<void>;
  setActive: (id: number) => Promise<void>;
  update: (id: number, data: Partial<LifeStage>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useStageStore = create<StageStore>((set, get) => ({
  stages: [],
  activeStage: null,
  loading: true,

  load: async () => {
    const stages = await db.lifeStages.orderBy('order').toArray();
    const activeStage = stages.find(s => s.isActive) || null;
    set({ stages, activeStage, loading: false });
  },

  add: async (stage) => {
    await db.lifeStages.add({ ...stage, createdAt: new Date() });
    get().load();
  },

  setActive: async (id) => {
    await db.lifeStages.toCollection().modify({ isActive: false });
    await db.lifeStages.update(id, { isActive: true });
    get().load();
  },

  update: async (id, data) => {
    await db.lifeStages.update(id, data);
    get().load();
  },

  remove: async (id) => {
    await db.lifeStages.delete(id);
    get().load();
  },
}));
