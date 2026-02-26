'use client';
import { useEffect, useState } from 'react';
import { Zap, Brain, Plus, Check, Pause, X, Sunrise, Moon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useQuestStore } from '@/lib/stores/questStore';
import { useCheckinStore } from '@/lib/stores/checkinStore';

export default function TodayPage() {
  const { load: loadQuests, setStatus, getTop3, getDailies, getBoss, add } = useQuestStore();
  const { today, load: loadCheckin, save } = useCheckinStore();
  const [quickCapture, setQuickCapture] = useState('');

  useEffect(() => { loadQuests(); loadCheckin(); }, [loadQuests, loadCheckin]);

  const top3 = getTop3();
  const dailies = getDailies();
  const bossQuest = getBoss();
  const energy = today?.energy || 3;
  const focus = today?.focus || 3;

  const handleQuickCapture = () => {
    if (!quickCapture.trim()) return;
    add({ title: quickCapture.trim(), description: '', type: 'task', status: 'available', xp: 15, isTop3: false });
    setQuickCapture('');
  };

  return (
    <div className="space-y-4">
      {/* Morning Startup */}
      {!today?.startup && (
        <Card glowColor="#06b6d4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Sunrise size={16} className="text-cyan-600" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Morning Startup</div>
          </div>
          <textarea
            className="w-full bg-surface border border-card-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400"
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
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-2">
              <Zap size={12} className="text-amber-500" /> Energy
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => save({ energy: n })}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    n <= energy ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm' : 'bg-surface border border-card-border text-muted'
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-2">
              <Brain size={12} className="text-blue-500" /> Focus
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => save({ focus: n })}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    n <= focus ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm' : 'bg-surface border border-card-border text-muted'
                  }`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Top 3 */}
      <Card>
        <CardHeader>Top 3 Priority</CardHeader>
        <div className="space-y-2">
          {top3.slice(0, 3).map(q => <QuestRow key={q.id} quest={q} onStatus={setStatus} />)}
          {top3.length === 0 && <p className="text-sm text-muted">Mark quests as Top 3 in Campaigns.</p>}
        </div>
      </Card>

      {/* Boss Quest */}
      {bossQuest && (
        <Card glowColor="#ef4444">
          <CardHeader>Boss Quest</CardHeader>
          <QuestRow quest={bossQuest} onStatus={setStatus} />
        </Card>
      )}

      {/* Dailies */}
      <Card>
        <CardHeader>Dailies</CardHeader>
        <div className="space-y-2">
          {dailies.map(q => <QuestRow key={q.id} quest={q} onStatus={setStatus} />)}
          {dailies.length === 0 && <p className="text-sm text-muted">No dailies active.</p>}
        </div>
      </Card>

      {/* Quick Capture */}
      <Card>
        <CardHeader>Quick Capture</CardHeader>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-card-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="Add a quest..."
            value={quickCapture}
            onChange={e => setQuickCapture(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickCapture()}
          />
          <Button variant="primary" size="sm" onClick={handleQuickCapture}><Plus size={16} /></Button>
        </div>
      </Card>

      {/* Evening Shutdown */}
      <Card glowColor="#8b5cf6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Moon size={16} className="text-purple-600" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Evening Shutdown</div>
        </div>
        <textarea
          className="w-full bg-surface border border-card-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
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
    <div className="flex items-center gap-2 group bg-surface rounded-xl p-2.5">
      <Badge label={quest.type} />
      <span className="text-sm font-medium flex-1">{quest.title}</span>
      <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold"><Zap size={10} />+{quest.xp}</div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onStatus(quest.id!, 'done')} className="p-1.5 text-green-500 hover:bg-green-100 rounded-lg"><Check size={14} /></button>
        <button onClick={() => onStatus(quest.id!, 'snoozed')} className="p-1.5 text-purple-500 hover:bg-purple-100 rounded-lg"><Pause size={14} /></button>
        <button onClick={() => onStatus(quest.id!, 'failed')} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><X size={14} /></button>
      </div>
    </div>
  );
}
