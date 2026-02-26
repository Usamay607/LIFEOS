'use client';
import { useEffect, useState } from 'react';
import { Target, Plus, Pin, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { quests, load: loadQuests, getByCampaign } = useQuestStore();
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
      stageId: activeStage.id,
      title: newTitle.trim(),
      description: '',
      status: 'planned',
      progress: 0,
      isPinned: false,
      milestones: [],
      dependencies: [],
      domainId: domains[0]?.id || 0,
    });
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-pixel)] text-xs text-accent-green">Campaigns</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
          <Plus size={14} />
        </Button>
      </div>

      {showAdd && (
        <Card>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-green"
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
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-accent-green/20 text-accent-green' : 'text-muted hover:text-foreground'}`}
        >
          All ({campaigns.length})
        </button>
        {FILTERS.map(f => {
          const count = campaigns.filter(c => c.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap capitalize transition-colors ${filter === f ? 'bg-accent-green/20 text-accent-green' : 'text-muted hover:text-foreground'}`}
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
            <Card key={c.id} glowColor={c.isPinned ? 'var(--accent-gold)' : undefined}>
              <div className="flex items-start justify-between" onClick={() => setExpanded(isExpanded ? null : c.id!)}>
                <div className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    {c.isPinned && <Pin size={12} className="text-accent-gold" />}
                    <span className="text-sm font-semibold">{c.title}</span>
                    <Badge label={c.status} />
                  </div>
                  <ProgressBar value={c.progress} showLabel label={domain?.name || ''} />
                </div>
                <button className="p-1 text-muted">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-card-border space-y-3">
                  {c.description && <p className="text-sm text-muted">{c.description}</p>}

                  {c.milestones.length > 0 && (
                    <div>
                      <div className="text-[10px] text-muted uppercase mb-1">Milestones</div>
                      {c.milestones.map((m, i) => (
                        <div key={i} className="text-xs text-foreground/80 ml-2">• {m}</div>
                      ))}
                    </div>
                  )}

                  {cQuests.length > 0 && (
                    <div>
                      <div className="text-[10px] text-muted uppercase mb-1">Quests ({cQuests.length})</div>
                      {cQuests.slice(0, 5).map(q => (
                        <div key={q.id} className="flex items-center gap-2 ml-2 text-xs">
                          <Badge label={q.type} />
                          <span>{q.title}</span>
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
