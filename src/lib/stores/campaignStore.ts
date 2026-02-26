import { create } from 'zustand';
import { db } from '../db';
import type { Campaign, CampaignStatus } from '../types';

interface CampaignStore {
  campaigns: Campaign[];
  pinnedCampaign: Campaign | null;
  loading: boolean;
  load: () => Promise<void>;
  add: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: number, data: Partial<Campaign>) => Promise<void>;
  setStatus: (id: number, status: CampaignStatus) => Promise<void>;
  pin: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getByStage: (stageId: number) => Campaign[];
  getActive: () => Campaign[];
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  pinnedCampaign: null,
  loading: true,

  load: async () => {
    const campaigns = await db.campaigns.toArray();
    const pinnedCampaign = campaigns.find(c => c.isPinned) || null;
    set({ campaigns, pinnedCampaign, loading: false });
  },

  add: async (campaign) => {
    await db.campaigns.add({ ...campaign, createdAt: new Date() });
    get().load();
  },

  update: async (id, data) => {
    await db.campaigns.update(id, data);
    get().load();
  },

  setStatus: async (id, status) => {
    await db.campaigns.update(id, { status });
    get().load();
  },

  pin: async (id) => {
    await db.campaigns.toCollection().modify({ isPinned: false });
    await db.campaigns.update(id, { isPinned: true });
    get().load();
  },

  remove: async (id) => {
    await db.campaigns.delete(id);
    get().load();
  },

  getByStage: (stageId) => get().campaigns.filter(c => c.stageId === stageId),
  getActive: () => get().campaigns.filter(c => c.status === 'active'),
}));
