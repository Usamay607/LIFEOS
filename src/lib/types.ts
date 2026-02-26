export interface Profile {
  id?: number;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  createdAt: Date;
}

export interface LifeStage {
  id?: number;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  completionCriteria: string[];
  createdAt: Date;
}

export type DomainName = 'Health' | 'Career' | 'Finance' | 'Relationships' | 'Growth' | 'Fun';

export interface Domain {
  id?: number;
  name: DomainName;
  icon: string;
  healthScore: number; // 0-100
  maintenanceFloor: number;
  growthTarget: number;
}

export type CampaignStatus = 'planned' | 'active' | 'blocked' | 'completed' | 'archived';

export interface Campaign {
  id?: number;
  stageId: number;
  title: string;
  description: string;
  status: CampaignStatus;
  progress: number; // 0-100
  isPinned: boolean;
  milestones: string[];
  dependencies: number[];
  domainId: number;
  createdAt: Date;
}

export type QuestType = 'daily' | 'habit' | 'task' | 'boss' | 'milestone';
export type QuestStatus = 'locked' | 'available' | 'active' | 'done' | 'failed' | 'snoozed';

export interface Quest {
  id?: number;
  campaignId?: number;
  domainId?: number;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  xp: number;
  dueDate?: Date;
  recurrence?: string; // 'daily' | 'weekly' | 'monthly'
  isTop3: boolean;
  createdAt: Date;
}

export interface GameEvent {
  id?: number;
  questId?: number;
  type: string;
  timestamp: Date;
  notes: string;
}

export interface DailyCheckin {
  id?: number;
  date: string; // YYYY-MM-DD
  energy: number; // 1-5
  focus: number; // 1-5
  top3: number[]; // quest IDs
  startup: string;
  shutdown: string;
  notes: string;
  createdAt: Date;
}

export type ReviewType = 'daily' | 'weekly' | 'monthly' | 'stage';

export interface Review {
  id?: number;
  type: ReviewType;
  date: string;
  summary: string;
  wins: string[];
  losses: string[];
  insights: string[];
  createdAt: Date;
}

export interface Reward {
  id?: number;
  title: string;
  description: string;
  xpCost: number;
  unlocked: boolean;
}

export interface Metric {
  id?: number;
  domainId: number;
  key: string;
  value: number;
  date: string;
}
