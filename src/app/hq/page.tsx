'use client';
import { useEffect } from 'react';
import { Shield, AlertTriangle, Trophy, Target, Zap } from 'lucide-react';
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
  score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

export default function HQPage() {
  const { activeStage, load: loadStages } = useStageStore();
  const { campaigns, load: loadCampaigns } = useCampaignStore();
  const { load: loadQuests, getTop3, getBoss } = useQuestStore();
  const { domains, load: loadDomains, getLowest } = useDomainStore();

  useEffect(() => {
    loadStages(); loadCampaigns(); loadQuests(); loadDomains();
  }, [loadStages, loadCampaigns, loadQuests, loadDomains]);

  const top3 = getTop3();
  const bossQuest = getBoss();
  const lowestDomain = getLowest();
  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  return (
    <div className="space-y-4">
      {/* Active Life Stage */}
      <Card glowColor="#8b5cf6">
        <CardHeader>Current Stage</CardHeader>
        {activeStage ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Shield size={18} className="text-purple-600" />
            </div>
            <div>
              <span className="font-bold text-sm">{activeStage.title}</span>
              <p className="text-xs text-muted">{activeStage.description}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No active stage. Set one in System.</p>
        )}
      </Card>

      {/* Top 3 Today */}
      <Card>
        <CardHeader>Top 3 Today</CardHeader>
        {top3.length > 0 ? (
          <div className="space-y-2.5">
            {top3.slice(0, 3).map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 bg-surface rounded-xl p-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {i + 1}
                </div>
                <span className="text-sm font-medium flex-1">{q.title}</span>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <Zap size={10} />
                  <span className="text-[10px] font-bold">+{q.xp}</span>
                </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {c.isPinned && <Target size={12} className="text-amber-500" />}
                    <span className="text-sm font-semibold">{c.title}</span>
                  </div>
                  <Badge label={c.status} />
                </div>
                <ProgressBar value={c.progress} color={c.isPinned ? '#f59e0b' : '#3b82f6'} height={6} />
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
            <div key={d.id} className="bg-surface rounded-xl p-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{DOMAIN_ICONS[d.name] || '📊'}</span>
                <span className="text-xs font-semibold">{d.name}</span>
                <span className="text-xs font-bold ml-auto" style={{ color: HEALTH_COLOR(d.healthScore) }}>
                  {d.healthScore}
                </span>
              </div>
              <ProgressBar value={d.healthScore} color={HEALTH_COLOR(d.healthScore)} height={5} />
            </div>
          ))}
        </div>
      </Card>

      {/* Boss Quest */}
      {bossQuest && (
        <Card glowColor="#ef4444">
          <CardHeader>Boss Quest</CardHeader>
          <div className="flex items-center gap-3 bg-red-50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm">
              <Trophy size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold">{bossQuest.title}</span>
              <p className="text-xs text-muted">{bossQuest.description}</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Zap size={10} />
              <span className="text-[10px] font-bold">+{bossQuest.xp}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Bottleneck Alert */}
      {lowestDomain && lowestDomain.healthScore < lowestDomain.maintenanceFloor && (
        <Card glowColor="#ef4444">
          <div className="flex items-center gap-3 bg-red-50 rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-red-600">Attention Needed</span>
              <p className="text-xs text-red-500/80">
                {lowestDomain.name} is at {lowestDomain.healthScore} — below {lowestDomain.maintenanceFloor} floor
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
