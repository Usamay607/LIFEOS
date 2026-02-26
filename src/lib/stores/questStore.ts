import { create } from 'zustand';
import { db } from '../db';
import type { Quest, QuestStatus } from '../types';

interface QuestStore {
  quests: Quest[];
  loading: boolean;
  load: () => Promise<void>;
  add: (quest: Omit<Quest, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: number, data: Partial<Quest>) => Promise<void>;
  setStatus: (id: number, status: QuestStatus) => Promise<void>;
  toggleTop3: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getTop3: () => Quest[];
  getDailies: () => Quest[];
  getBoss: () => Quest | undefined;
  getByStatus: (status: QuestStatus) => Quest[];
  getByCampaign: (campaignId: number) => Quest[];
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  quests: [],
  loading: true,

  load: async () => {
    const quests = await db.quests.toArray();
    set({ quests, loading: false });
  },

  add: async (quest) => {
    await db.quests.add({ ...quest, createdAt: new Date() });
    get().load();
  },

  update: async (id, data) => {
    await db.quests.update(id, data);
    get().load();
  },

  setStatus: async (id, status) => {
    if (status === 'done') {
      const quest = await db.quests.get(id);
      if (quest) {
        await db.events.add({ questId: id, type: 'completed', timestamp: new Date(), notes: '' });
        // Award XP
        const profile = await db.profiles.toCollection().first();
        if (profile?.id) {
          await db.profiles.update(profile.id, { xp: (profile.xp || 0) + quest.xp });
        }
      }
    }
    await db.quests.update(id, { status });
    get().load();
  },

  toggleTop3: async (id) => {
    const quest = await db.quests.get(id);
    if (quest) {
      await db.quests.update(id, { isTop3: !quest.isTop3 });
      get().load();
    }
  },

  remove: async (id) => {
    await db.quests.delete(id);
    get().load();
  },

  getTop3: () => get().quests.filter(q => q.isTop3 && q.status !== 'done' && q.status !== 'failed'),
  getDailies: () => get().quests.filter(q => q.type === 'daily' && q.status !== 'done'),
  getBoss: () => get().quests.find(q => q.type === 'boss' && q.status !== 'done'),
  getByStatus: (status) => get().quests.filter(q => q.status === status),
  getByCampaign: (campaignId) => get().quests.filter(q => q.campaignId === campaignId),
}));
