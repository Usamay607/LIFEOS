'use client';
import { useEffect } from 'react';
import { Check, ChevronRight, Star } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useStageStore } from '@/lib/stores/stageStore';
import { useCampaignStore } from '@/lib/stores/campaignStore';

export default function LifeMapPage() {
  const { stages, activeStage, load: loadStages } = useStageStore();
  const { campaigns, load: loadCampaigns } = useCampaignStore();

  useEffect(() => {
    loadStages();
    loadCampaigns();
  }, [loadStages, loadCampaigns]);

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-pixel)] text-xs text-accent-green">Life Map</h1>

      {/* Stage Timeline */}
      <div className="relative">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStage?.id;
          const stageCampaigns = campaigns.filter(c => c.stageId === stage.id);
          const completedCampaigns = stageCampaigns.filter(c => c.status === 'completed').length;
          const totalCriteria = stage.completionCriteria.length;

          return (
            <div key={stage.id} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              {i < stages.length - 1 && (
                <div className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-card-border" />
              )}

              {/* Node */}
              <div className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                isActive
                  ? 'border-accent-green bg-accent-green/20'
                  : completedCampaigns === stageCampaigns.length && stageCampaigns.length > 0
                    ? 'border-accent-gold bg-accent-gold/20'
                    : 'border-card-border bg-card'
              }`}>
                {isActive ? (
                  <Star size={12} className="text-accent-green" />
                ) : completedCampaigns === stageCampaigns.length && stageCampaigns.length > 0 ? (
                  <Check size={12} className="text-accent-gold" />
                ) : (
                  <span className="text-[10px] text-muted">{i + 1}</span>
                )}
              </div>

              {/* Stage Card */}
              <Card glowColor={isActive ? 'var(--accent-green)' : undefined}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{stage.title}</span>
                  {isActive && <Badge label="active" />}
                </div>
                <p className="text-xs text-muted mb-3">{stage.description}</p>

                {/* Completion Criteria */}
                {totalCriteria > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] text-muted uppercase mb-1">Completion Criteria</div>
                    {stage.completionCriteria.map((c, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs ml-1">
                        <div className={`w-3 h-3 rounded-sm border ${j < completedCampaigns ? 'bg-accent-green/30 border-accent-green' : 'border-card-border'}`} />
                        <span className={j < completedCampaigns ? 'text-accent-green' : 'text-foreground/70'}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Linked Campaigns */}
                {stageCampaigns.length > 0 && (
                  <div>
                    <div className="text-[10px] text-muted uppercase mb-1">Campaigns</div>
                    {stageCampaigns.map(c => (
                      <div key={c.id} className="flex items-center gap-2 mb-1">
                        <ChevronRight size={10} className="text-muted" />
                        <span className="text-xs">{c.title}</span>
                        <Badge label={c.status} className="ml-auto" />
                        <span className="text-[10px] text-muted">{c.progress}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })}

        {stages.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No life stages defined. Create one in System.</p>
        )}
      </div>
    </div>
  );
}
