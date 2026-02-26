'use client';
import { useEffect, useState } from 'react';
import { Plus, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCampaignStore } from '@/lib/stores/campaignStore';
import { useQuestStore } from '@/lib/stores/questStore';
import { useDomainStore } from '@/lib/stores/domainStore';
import { useStageStore } from '@/lib/stores/stageStore';
import type { CampaignStatus } from '@/lib/types';

const FILTERS: CampaignStatus[] = ['active', 'planned', 'blocked', 'completed', 'archived'];

export default function CampaignsPage() {
  const { campaigns, load: loadCampaigns, pin, setStatus, add } = useCampaignStore();
  const { load: loadQuests, getByCampaign } = useQuestStore();
  const { domains, load: loadDomains } = useDomainStore();
  const { activeStage, load: loadStages } = useStageStore();
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    loadCampaigns();
    loadQuests();
    loadDomains();
    loadStages();
  }, [loadCampaigns, loadQuests, loadDomains, loadStages]);

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter);

  const handleAdd = () => {
    if (!newTitle.trim() || !activeStage?.id) return;
    add({
      stageId: activeStage.id, title: newTitle.trim(), description: '', status: 'planned',
      progress: 0, isPinned: false, milestones: [], dependencies: [], domainId: domains[0]?.id || 0,
    });
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Campaigns</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
          <Plus size={14} className="mr-1" /> New
        </Button>
      </div>

      {showAdd && (
        <Card>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-surface border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Campaign title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={handleAdd}>Add</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(['all', ...FILTERS] as const).map(f => {
          const count = f === 'all' ? campaigns.length : campaigns.filter(c => c.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                filter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-muted hover:text-foreground shadow-sm border border-card-border'
              }`}
            >
              {f} ({count})
            </button>
          );
        })}
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {filtered.map(c => {
          const cQuests = getByCampaign(c.id!);
          const isExpanded = expanded === c.id;
          const domain = domains.find(d => d.id === c.domainId);

          return (
            <Card key={c.id} glowColor={c.isPinned ? '#f59e0b' : undefined}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : c.id!)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {c.isPinned && <Pin size={12} className="text-amber-500" />}
                    <span className="text-sm font-bold">{c.title}</span>
                    <Badge label={c.status} />
                  </div>
                  <ProgressBar value={c.progress} showLabel label={domain?.name || ''} height={6} color={c.isPinned ? '#f59e0b' : '#3b82f6'} />
                </div>
                <button className="p-1 text-muted ml-2">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-card-border space-y-3">
                  {c.description && <p className="text-sm text-muted">{c.description}</p>}

                  {c.milestones.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-muted uppercase mb-1">Milestones</div>
                      {c.milestones.map((m, i) => (
                        <div key={i} className="text-xs text-foreground/80 ml-2">• {m}</div>
                      ))}
                    </div>
                  )}

                  {cQuests.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-muted uppercase mb-1">Quests ({cQuests.length})</div>
                      {cQuests.slice(0, 5).map(q => (
                        <div key={q.id} className="flex items-center gap-2 ml-2 text-xs bg-surface rounded-lg p-1.5 mb-1">
                          <Badge label={q.type} />
                          <span className="font-medium">{q.title}</span>
                          <Badge label={q.status} className="ml-auto" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!c.isPinned && (
                      <Button size="sm" onClick={() => pin(c.id!)}>
                        <Pin size={12} className="mr-1" /> Pin
                      </Button>
                    )}
                    {c.status !== 'completed' && (
                      <Button size="sm" variant="primary" onClick={() => setStatus(c.id!, 'completed')}>
                        Complete
                      </Button>
                    )}
                    {c.status === 'planned' && (
                      <Button size="sm" variant="primary" onClick={() => setStatus(c.id!, 'active')}>
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No campaigns found.</p>
        )}
      </div>
    </div>
  );
}
