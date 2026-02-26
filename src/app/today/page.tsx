'use client';
import { useEffect, useState } from 'react';
import { Zap, Brain, Sword, Plus, Check, Pause, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useQuestStore } from '@/lib/stores/questStore';
import { useCheckinStore } from '@/lib/stores/checkinStore';

export default function TodayPage() {
  const { quests, load: loadQuests, setStatus, getTop3, getDailies, getBoss, add } = useQuestStore();
  const { today, load: loadCheckin, save } = useCheckinStore();
  const [quickCapture, setQuickCapture] = useState('');

  useEffect(() => {
    loadQuests();
    loadCheckin();
  }, [loadQuests, loadCheckin]);

  const top3 = getTop3();
  const dailies = getDailies();
  const bossQuest = getBoss();
  const energy = today?.energy || 3;
  const focus = today?.focus || 3;

  const handleQuickCapture = () => {
    if (!quickCapture.trim()) return;
    add({
      title: quickCapture.trim(),
      description: '',
      type: 'task',
      status: 'available',
      xp: 15,
      isTop3: false,
    });
    setQuickCapture('');
  };

  return (
    <div className="space-y-4">
      {/* Morning Startup */}
      {!today?.startup && (
        <Card glowColor="var(--accent-cyan)">
          <CardHeader>Morning Startup</CardHeader>
          <textarea
            className="w-full bg-transparent border border-card-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-accent-cyan"
            rows={2}
            placeholder="What's your intention for today?"
            onBlur={(e) => save({ startup: e.target.value })}
          />
        </Card>
      )}

      {/* Energy & Focus */}
      <Card>
        <CardHeader>Status Check</CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted mb-2">
              <Zap size={12} className="text-accent-gold" /> Energy
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => save({ energy: n })}
                  className={`w-8 h-8 rounded text-xs transition-colors ${
                    n <= energy
                      ? 'bg-accent-gold/30 text-accent-gold border border-accent-gold/50'
                      : 'bg-card border border-card-border text-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted mb-2">
              <Brain size={12} className="text-accent-blue" /> Focus
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => save({ focus: n })}
                  className={`w-8 h-8 rounded text-xs transition-colors ${
                    n <= focus
                      ? 'bg-accent-blue/30 text-accent-blue border border-accent-blue/50'
                      : 'bg-card border border-card-border text-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Top 3 */}
      <Card>
        <CardHeader>Top 3 Priority</CardHeader>
        <div className="space-y-2">
          {top3.slice(0, 3).map(q => (
            <QuestRow key={q.id} quest={q} onStatus={setStatus} />
          ))}
          {top3.length === 0 && <p className="text-sm text-muted">Mark quests as Top 3 in Campaigns.</p>}
        </div>
      </Card>

      {/* Boss Quest */}
      {bossQuest && (
        <Card glowColor="var(--accent-red)">
          <CardHeader>Boss Quest</CardHeader>
          <QuestRow quest={bossQuest} onStatus={setStatus} />
        </Card>
      )}

      {/* Dailies */}
      <Card>
        <CardHeader>Dailies</CardHeader>
        <div className="space-y-2">
          {dailies.map(q => (
            <QuestRow key={q.id} quest={q} onStatus={setStatus} />
          ))}
          {dailies.length === 0 && <p className="text-sm text-muted">No dailies active.</p>}
        </div>
      </Card>

      {/* Quick Capture */}
      <Card>
        <CardHeader>Quick Capture</CardHeader>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-green"
            placeholder="Add a quest..."
            value={quickCapture}
            onChange={e => setQuickCapture(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickCapture()}
          />
          <Button variant="primary" size="sm" onClick={handleQuickCapture}>
            <Plus size={16} />
          </Button>
        </div>
      </Card>

      {/* Evening Shutdown */}
      <Card glowColor="var(--accent-purple)">
        <CardHeader>Evening Shutdown</CardHeader>
        <textarea
          className="w-full bg-transparent border border-card-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-accent-purple"
          rows={2}
          placeholder="How did today go? Any wins or lessons?"
          defaultValue={today?.shutdown || ''}
          onBlur={(e) => save({ shutdown: e.target.value })}
        />
      </Card>
    </div>
  );
}

function QuestRow({ quest, onStatus }: { quest: { id?: number; title: string; type: string; xp: number; status: string }; onStatus: (id: number, status: 'done' | 'failed' | 'snoozed') => void }) {
  if (!quest.id) return null;
  return (
    <div className="flex items-center gap-2 group">
      <Badge label={quest.type} />
      <span className="text-sm flex-1">{quest.title}</span>
      <span className="text-[10px] text-accent-green font-mono">+{quest.xp}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onStatus(quest.id!, 'done')} className="p-1 text-accent-green hover:bg-accent-green/20 rounded" title="Complete">
          <Check size={14} />
        </button>
        <button onClick={() => onStatus(quest.id!, 'snoozed')} className="p-1 text-accent-purple hover:bg-accent-purple/20 rounded" title="Snooze">
          <Pause size={14} />
        </button>
        <button onClick={() => onStatus(quest.id!, 'failed')} className="p-1 text-accent-red hover:bg-accent-red/20 rounded" title="Fail">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
