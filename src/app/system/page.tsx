'use client';
import { useEffect, useState } from 'react';
import { Database, Download, Upload, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { useStageStore } from '@/lib/stores/stageStore';
import { useDomainStore } from '@/lib/stores/domainStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export default function SystemPage() {
  const { stages, load: loadStages, add: addStage, setActive, remove: removeStage } = useStageStore();
  const { domains, load: loadDomains, update: updateDomain } = useDomainStore();
  const { profile, load: loadProfile, update: updateProfile } = useProfileStore();
  const [newStage, setNewStage] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => { loadStages(); loadDomains(); loadProfile(); loadStats(); }, [loadStages, loadDomains, loadProfile]);

  async function loadStats() {
    setStats({
      stages: await db.lifeStages.count(), campaigns: await db.campaigns.count(),
      quests: await db.quests.count(), events: await db.events.count(),
      checkins: await db.dailyCheckins.count(), reviews: await db.reviews.count(),
    });
  }

  async function exportData() {
    const data = {
      profiles: await db.profiles.toArray(), lifeStages: await db.lifeStages.toArray(),
      domains: await db.domains.toArray(), campaigns: await db.campaigns.toArray(),
      quests: await db.quests.toArray(), events: await db.events.toArray(),
      dailyCheckins: await db.dailyCheckins.toArray(), reviews: await db.reviews.toArray(),
      rewards: await db.rewards.toArray(), metrics: await db.metrics.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `lifeos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text(); const data = JSON.parse(text);
    await db.delete(); await db.open();
    for (const [table, rows] of Object.entries(data)) {
      const t = (db as unknown as Record<string, unknown>)[table];
      if (t && typeof t === 'object' && 'bulkAdd' in t) {
        await (t as { bulkAdd: (rows: unknown[]) => Promise<void> }).bulkAdd(rows as unknown[]);
      }
    }
    window.location.reload();
  }

  async function resetData() {
    if (!confirm('This will delete all data. Are you sure?')) return;
    await db.delete(); await db.open(); await seedDatabase(); window.location.reload();
  }

  const handleAddStage = () => {
    if (!newStage.trim()) return;
    addStage({ title: newStage.trim(), description: '', isActive: false, order: stages.length + 1, completionCriteria: [] });
    setNewStage('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">System</h1>

      <Card>
        <CardHeader>Profile</CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl shadow-sm">
            {profile?.avatar || '🎮'}
          </div>
          <div className="flex-1">
            <input className="bg-surface border border-card-border rounded-xl px-3 py-1.5 text-sm font-semibold w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={profile?.name || ''} onChange={e => updateProfile({ name: e.target.value })} />
            <div className="text-xs text-muted mt-1 font-medium">Level {profile?.level || 1} · {profile?.xp || 0} XP</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>Life Stages</CardHeader>
        <div className="space-y-2 mb-3">
          {stages.map(s => (
            <div key={s.id} className="flex items-center gap-2 bg-surface rounded-xl p-2.5">
              <button onClick={() => setActive(s.id!)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  s.isActive ? 'border-blue-500 bg-blue-500' : 'border-gray-300 hover:border-blue-300'
                }`}>{s.isActive && <div className="w-2 h-2 rounded-full bg-white" />}</button>
              <span className={`text-sm font-medium flex-1 ${s.isActive ? 'text-blue-600' : ''}`}>{s.title}</span>
              {!s.isActive && (
                <button onClick={() => removeStage(s.id!)} className="text-muted hover:text-red-500 p-1"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 bg-surface border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="New stage..." value={newStage} onChange={e => setNewStage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddStage()} />
          <Button size="sm" variant="primary" onClick={handleAddStage}><Plus size={14} /></Button>
        </div>
      </Card>

      <Card>
        <CardHeader>Domain Health</CardHeader>
        <div className="space-y-3">
          {domains.map(d => (
            <div key={d.id}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium">{d.name}</span>
                <input type="number" min={0} max={100}
                  className="w-14 bg-surface border border-card-border rounded-lg px-2 py-1 text-xs text-right font-bold focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={d.healthScore} onChange={e => updateDomain(d.id!, { healthScore: parseInt(e.target.value) || 0 })} />
              </div>
              <ProgressBar value={d.healthScore} height={6}
                color={d.healthScore >= 70 ? '#22c55e' : d.healthScore >= 40 ? '#f59e0b' : '#ef4444'} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><div className="flex items-center gap-1"><Database size={12} /> Diagnostics</div></CardHeader>
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="bg-surface rounded-xl p-2.5">
              <div className="text-lg font-bold text-primary">{val}</div>
              <div className="text-[10px] text-muted font-semibold capitalize">{key}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>Data</CardHeader>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={exportData}><Download size={12} className="mr-1" /> Export</Button>
          <label className="cursor-pointer">
            <Button size="sm" as-child><span><Upload size={12} className="mr-1 inline" /> Import</span></Button>
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
          <Button size="sm" variant="danger" onClick={resetData}><RefreshCw size={12} className="mr-1" /> Reset</Button>
        </div>
      </Card>
    </div>
  );
}
