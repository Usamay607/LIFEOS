import { db } from './db';
import type { DomainName } from './types';

const DEFAULT_DOMAINS: { name: DomainName; icon: string; maintenanceFloor: number; growthTarget: number }[] = [
  { name: 'Health', icon: 'heart', maintenanceFloor: 40, growthTarget: 80 },
  { name: 'Career', icon: 'briefcase', maintenanceFloor: 50, growthTarget: 85 },
  { name: 'Finance', icon: 'wallet', maintenanceFloor: 45, growthTarget: 75 },
  { name: 'Relationships', icon: 'users', maintenanceFloor: 40, growthTarget: 70 },
  { name: 'Growth', icon: 'brain', maintenanceFloor: 30, growthTarget: 80 },
  { name: 'Fun', icon: 'gamepad-2', maintenanceFloor: 25, growthTarget: 60 },
];

export async function seedDatabase() {
  const domainCount = await db.domains.count();
  if (domainCount > 0) return; // already seeded

  // Profile
  await db.profiles.add({
    name: 'Player One',
    avatar: '🎮',
    level: 1,
    xp: 0,
    createdAt: new Date(),
  });

  // Domains
  const domainIds: number[] = [];
  for (const d of DEFAULT_DOMAINS) {
    const id = await db.domains.add({
      ...d,
      healthScore: 50,
    });
    domainIds.push(id);
  }

  // Life Stage
  const stageId = await db.lifeStages.add({
    title: 'Foundation Arc',
    description: 'Build core habits, establish financial runway, and lock in career trajectory.',
    isActive: true,
    order: 1,
    completionCriteria: ['Emergency fund built', 'Consistent gym habit', 'Career path clear'],
    createdAt: new Date(),
  });

  // Campaign
  const campaignId = await db.campaigns.add({
    stageId,
    title: 'Health Reboot',
    description: 'Get consistent with gym, nutrition, and sleep.',
    status: 'active',
    progress: 25,
    isPinned: true,
    milestones: ['Gym 3x/week for 4 weeks', 'Track macros daily', 'Sleep 7h+ consistently'],
    dependencies: [],
    domainId: domainIds[0],
    createdAt: new Date(),
  });

  // Quests
  const now = new Date();
  await db.quests.bulkAdd([
    { title: 'Morning workout', description: 'Hit the gym before 8am', type: 'daily', status: 'available', xp: 20, campaignId, domainId: domainIds[0], recurrence: 'daily', isTop3: true, createdAt: now },
    { title: 'Track meals in app', description: 'Log all meals', type: 'habit', status: 'available', xp: 10, campaignId, domainId: domainIds[0], recurrence: 'daily', isTop3: false, createdAt: now },
    { title: 'Deep work block', description: '2h focused work session', type: 'task', status: 'available', xp: 30, domainId: domainIds[1], isTop3: true, createdAt: now },
    { title: 'Weekly budget review', description: 'Review spending vs budget', type: 'task', status: 'available', xp: 25, domainId: domainIds[2], dueDate: new Date(now.getTime() + 7 * 86400000), isTop3: false, createdAt: now },
    { title: 'Run 5K under 25min', description: 'Complete 5K run boss challenge', type: 'boss', status: 'available', xp: 100, campaignId, domainId: domainIds[0], isTop3: true, createdAt: now },
    { title: 'Read 30 pages', description: 'Daily reading habit', type: 'habit', status: 'available', xp: 15, domainId: domainIds[4], recurrence: 'daily', isTop3: false, createdAt: now },
  ]);
}
