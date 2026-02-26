import { create } from 'zustand';
import { db } from '../db';
import type { Review, ReviewType } from '../types';

interface ReviewStore {
  reviews: Review[];
  loading: boolean;
  load: () => Promise<void>;
  add: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  getByType: (type: ReviewType) => Review[];
  getLatest: (type: ReviewType) => Review | undefined;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  loading: true,

  load: async () => {
    const reviews = await db.reviews.orderBy('date').reverse().toArray();
    set({ reviews, loading: false });
  },

  add: async (review) => {
    await db.reviews.add({ ...review, createdAt: new Date() });
    get().load();
  },

  getByType: (type) => get().reviews.filter(r => r.type === type),
  getLatest: (type) => get().reviews.find(r => r.type === type),
}));
