import Dexie, { type Table } from 'dexie';
import type {
  Profile, LifeStage, Domain, Campaign, Quest,
  GameEvent, DailyCheckin, Review, Reward, Metric,
} from './types';

export class LifeOSDatabase extends Dexie {
  profiles!: Table<Profile, number>;
  lifeStages!: Table<LifeStage, number>;
  domains!: Table<Domain, number>;
  campaigns!: Table<Campaign, number>;
  quests!: Table<Quest, number>;
  events!: Table<GameEvent, number>;
  dailyCheckins!: Table<DailyCheckin, number>;
  reviews!: Table<Review, number>;
  rewards!: Table<Reward, number>;
  metrics!: Table<Metric, number>;

  constructor() {
    super('LifeOSDB');
    this.version(1).stores({
      profiles: '++id, name',
      lifeStages: '++id, isActive, order',
      domains: '++id, name',
      campaigns: '++id, stageId, status, isPinned, domainId',
      quests: '++id, campaignId, domainId, type, status, isTop3, dueDate',
      events: '++id, questId, type, timestamp',
      dailyCheckins: '++id, &date',
      reviews: '++id, type, date',
      rewards: '++id, unlocked',
      metrics: '++id, domainId, key, date',
    });
  }
}

export const db = new LifeOSDatabase();
