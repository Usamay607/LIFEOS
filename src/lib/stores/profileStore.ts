import { create } from 'zustand';
import { db } from '../db';
import type { Profile } from '../types';

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (data: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  loading: true,

  load: async () => {
    const profile = await db.profiles.toCollection().first() || null;
    set({ profile, loading: false });
  },

  update: async (data) => {
    const { profile } = get();
    if (profile?.id) {
      await db.profiles.update(profile.id, data);
      get().load();
    }
  },
}));
