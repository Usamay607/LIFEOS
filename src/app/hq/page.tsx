'use client';
import { useEffect } from 'react';
import { Shield, AlertTriangle, Trophy, Target } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { useStageStore } from '@/lib/stores/stageStore';
import { useCampaignStore } from '@/lib/stores/campaignStore';
import { useQuestStore } from '@/lib/stores/questStore';
import { useDomainStore } from '@/lib/stores/domainStore';

const DOMAIN_ICONS: Record<string, string> = {
  Health: '❤️', Career: '💼', Finance: '💰',
  Relationships: '👥', Growth: '🧠', Fun: '🎮',
};

const HEALTH_COLOR = (score: number) =>
  score >= 70 ? 'var(--accent-green)' : score >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)';

export default function HQPage() {
  const { activeStage, load: loadStages } = useStageStore();
  const { campaigns, pinnedCampaign, load: loadCampaigns } = useCampaignStore();
  const { quests, load: loadQuests, getTop3, getBoss } = useQuestStore();
  const { domains, load: loadDomains, getLowest } = useDomainStore();

  useEffect(() => {
    loadStages();
    loadCampaigns();
    loadQuests();
    loadDomains();
  }, [loadStages, loadCampaigns, loadQuests, loadDomains]);

  const top3 = getTop3();
  const bossQuest = getBoss();
  const lowestDomain = getLowest();
  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  return (
    <div className="space-y-4">
      {/* Active Life Stage */}
      <Card glowColor="var(--accent-purple)">
        <CardHeader>Current Stage</CardHeader>
        {activeStage ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-accent-purple" />
              <span className="font-semibold">{activeStage.title}</span>
            </div>
            <p className="text-sm text-muted">{activeStage.description}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">No active stage. Set one in System.</p>
        )}
      </Card>

      {/* Top 3 Today */}
      <Card>
        <CardHeader>Top 3 Today</CardHeader>
        {top3.length > 0 ? (
          <div className="space-y-2">
            {top3.slice(0, 3).map((q, i) => (
              <div key={q.id} className="flex items-center gap-3">
                <span className="text-accent-gold font-[family-name:var(--font-pixel)] text-[10px]">{i + 1}</span>
                <span className="text-sm flex-1">{q.title}</span>
                <span className="text-[10px] text-accent-green font-mono">+{q.xp} XP</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No priority quests set. Head to Today.</p>
        )}
      </Card>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>Active Campaigns</CardHeader>
        {activeCampaigns.length > 0 ? (
          <div className="space-y-3">
            {activeCampaigns.map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {c.isPinned && <Target size={12} className="text-accent-gold" />}
                    <span className="text-sm">{c.title}</span>
                  </div>
                  <Badge label={c.status} />
                </div>
                <ProgressBar value={c.progress} color={c.isPinned ? 'var(--accent-gold)' : 'var(--accent-green)'} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No active campaigns.</p>
        )}
      </Card>

      {/* Domain Health */}
      <Card>
        <CardHeader>Domain Health</CardHeader>
        <div className="grid grid-cols-2 gap-3">
          {domains.map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <span className="text-base">{DOMAIN_ICONS[d.name] || '📊'}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>{d.name}</span>
                  <span style={{ color: HEALTH_COLOR(d.healthScore) }}>{d.healthScore}</span>
                </div>
                <ProgressBar value={d.healthScore} color={HEALTH_COLOR(d.healthScore)} height={4} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Boss Quest */}
      {bossQuest && (
        <Card glowColor="var(--accent-red)">
          <CardHeader>Boss Quest</CardHeader>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-accent-gold" />
            <span className="text-sm font-semibold">{bossQuest.title}</span>
            <span className="text-[10px] text-accent-green font-mono ml-auto">+{bossQuest.xp} XP</span>
          </div>
          <p className="text-xs text-muted mt-1">{bossQuest.description}</p>
        </Card>
      )}

      {/* Bottleneck Alert */}
      {lowestDomain && lowestDomain.healthScore < lowestDomain.maintenanceFloor && (
        <Card glowColor="var(--accent-red)">
          <CardHeader>Alert</CardHeader>
          <div className="flex items-center gap-2 text-accent-red">
            <AlertTriangle size={16} />
            <span className="text-sm">
              {lowestDomain.name} is below maintenance ({lowestDomain.healthScore}/{lowestDomain.maintenanceFloor})
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
