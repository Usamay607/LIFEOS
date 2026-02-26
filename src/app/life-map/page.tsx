'use client';
import { useEffect } from 'react';
import { Check, ChevronRight, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStageStore } from '@/lib/stores/stageStore';
import { useCampaignStore } from '@/lib/stores/campaignStore';

export default function LifeMapPage() {
  const { stages, activeStage, load: loadStages } = useStageStore();
  const { campaigns, load: loadCampaigns } = useCampaignStore();

  useEffect(() => { loadStages(); loadCampaigns(); }, [loadStages, loadCampaigns]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Life Map</h1>

      <div className="relative">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStage?.id;
          const stageCampaigns = campaigns.filter(c => c.stageId === stage.id);
          const completedCampaigns = stageCampaigns.filter(c => c.status === 'completed').length;
          const allDone = completedCampaigns === stageCampaigns.length && stageCampaigns.length > 0;

          return (
            <div key={stage.id} className="relative pl-10 pb-8 last:pb-0">
              {i < stages.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
              )}
              <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                isActive ? 'border-blue-500 bg-blue-50' : allDone ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              }`}>
                {isActive ? <Star size={14} className="text-blue-500" />
                  : allDone ? <Check size={14} className="text-green-500" />
                  : <span className="text-xs font-bold text-muted">{i + 1}</span>}
              </div>

              <Card glowColor={isActive ? '#3b82f6' : undefined}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold">{stage.title}</span>
                  {isActive && <Badge label="active" />}
                </div>
                <p className="text-xs text-muted mb-3">{stage.description}</p>

                {stage.completionCriteria.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-muted uppercase mb-1.5">Completion Criteria</div>
                    {stage.completionCriteria.map((c, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs mb-1">
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${j < completedCampaigns ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {j < completedCampaigns && <Check size={10} className="text-green-600" />}
                        </div>
                        <span className={j < completedCampaigns ? 'text-green-700 font-medium' : 'text-foreground/70'}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {stageCampaigns.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase mb-1.5">Campaigns</div>
                    {stageCampaigns.map(c => (
                      <div key={c.id} className="flex items-center gap-2 mb-1.5 bg-surface rounded-lg p-2">
                        <ChevronRight size={10} className="text-muted" />
                        <span className="text-xs font-medium">{c.title}</span>
                        <Badge label={c.status} className="ml-auto" />
                        <span className="text-[10px] font-bold text-muted">{c.progress}%</span>
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
