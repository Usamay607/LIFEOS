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

  useEffect(() => {
    loadStages();
    loadDomains();
    loadProfile();
    loadStats();
  }, [loadStages, loadDomains, loadProfile]);

  async function loadStats() {
    setStats({
      stages: await db.lifeStages.count(),
      campaigns: await db.campaigns.count(),
      quests: await db.quests.count(),
      events: await db.events.count(),
      checkins: await db.dailyCheckins.count(),
      reviews: await db.reviews.count(),
    });
  }

  async function exportData() {
    const data = {
      profiles: await db.profiles.toArray(),
      lifeStages: await db.lifeStages.toArray(),
      domains: await db.domains.toArray(),
      campaigns: await db.campaigns.toArray(),
      quests: await db.quests.toArray(),
      events: await db.events.toArray(),
      dailyCheckins: await db.dailyCheckins.toArray(),
      reviews: await db.reviews.toArray(),
      rewards: await db.rewards.toArray(),
      metrics: await db.metrics.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await db.delete();
    await db.open();
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
    await db.delete();
    await db.open();
    await seedDatabase();
    window.location.reload();
  }

  const handleAddStage = () => {
    if (!newStage.trim()) return;
    addStage({
      title: newStage.trim(),
      description: '',
      isActive: false,
      order: stages.length + 1,
      completionCriteria: [],
    });
    setNewStage('');
  };

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-pixel)] text-xs text-accent-green">System</h1>

      {/* Profile */}
      <Card>
        <CardHeader>Profile</CardHeader>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{profile?.avatar || '🎮'}</span>
            <input
              className="bg-transparent border border-card-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-accent-green"
              value={profile?.name || ''}
              onChange={e => updateProfile({ name: e.target.value })}
            />
          </div>
          <div className="text-xs text-muted">
            Level {profile?.level || 1} · {profile?.xp || 0} XP
          </div>
        </div>
      </Card>

      {/* Life Stages */}
      <Card>
        <CardHeader>Life Stages</CardHeader>
        <div className="space-y-2 mb-3">
          {stages.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => setActive(s.id!)}
                className={`w-3 h-3 rounded-full border-2 ${s.isActive ? 'border-accent-green bg-accent-green' : 'border-card-border'}`}
              />
              <span className={`text-sm flex-1 ${s.isActive ? 'text-accent-green' : ''}`}>{s.title}</span>
              {!s.isActive && (
                <button onClick={() => removeStage(s.id!)} className="text-muted hover:text-accent-red">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-transparent border border-card-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-accent-green"
            placeholder="New stage..."
            value={newStage}
            onChange={e => setNewStage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddStage()}
          />
          <Button size="sm" variant="primary" onClick={handleAddStage}>
            <Plus size={14} />
          </Button>
        </div>
      </Card>

      {/* Domain Health */}
      <Card>
        <CardHeader>Domain Health</CardHeader>
        <div className="space-y-3">
          {domains.map(d => (
            <div key={d.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{d.name}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-12 bg-transparent border border-card-border rounded px-1 py-0.5 text-xs text-right focus:outline-none"
                  value={d.healthScore}
                  onChange={e => updateDomain(d.id!, { healthScore: parseInt(e.target.value) || 0 })}
                />
              </div>
              <ProgressBar
                value={d.healthScore}
                color={d.healthScore >= 70 ? 'var(--accent-green)' : d.healthScore >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Diagnostics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1"><Database size={12} /> Diagnostics</div>
        </CardHeader>
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="bg-background rounded-lg p-2">
              <div className="text-lg font-mono text-accent-cyan">{val}</div>
              <div className="text-[10px] text-muted capitalize">{key}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>Data</CardHeader>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={exportData}>
            <Download size={12} className="mr-1" /> Export
          </Button>
          <label className="cursor-pointer">
            <Button size="sm" as-child>
              <span><Upload size={12} className="mr-1 inline" /> Import</span>
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
          <Button size="sm" variant="danger" onClick={resetData}>
            <RefreshCw size={12} className="mr-1" /> Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
