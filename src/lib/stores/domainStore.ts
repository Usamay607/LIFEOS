import { create } from 'zustand';
import { db } from '../db';
import type { Domain } from '../types';

interface DomainStore {
  domains: Domain[];
  loading: boolean;
  load: () => Promise<void>;
  update: (id: number, data: Partial<Domain>) => Promise<void>;
  getLowest: () => Domain | undefined;
}

export const useDomainStore = create<DomainStore>((set, get) => ({
  domains: [],
  loading: true,

  load: async () => {
    const domains = await db.domains.toArray();
    set({ domains, loading: false });
  },

  update: async (id, data) => {
    await db.domains.update(id, data);
    get().load();
  },

  getLowest: () => {
    const { domains } = get();
    if (!domains.length) return undefined;
    return domains.reduce((min, d) => d.healthScore < min.healthScore ? d : min, domains[0]);
  },
}));
