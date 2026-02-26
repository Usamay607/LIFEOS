'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useReviewStore } from '@/lib/stores/reviewStore';
import type { ReviewType } from '@/lib/types';

const TABS: { key: ReviewType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'stage', label: 'Stage' },
];

export default function ReviewsPage() {
  const { reviews, load, add, getByType } = useReviewStore();
  const [tab, setTab] = useState<ReviewType>('weekly');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ summary: '', wins: '', losses: '', insights: '' });

  useEffect(() => { load(); }, [load]);

  const filtered = getByType(tab);

  const handleSubmit = () => {
    add({
      type: tab,
      date: new Date().toISOString().slice(0, 10),
      summary: form.summary,
      wins: form.wins.split('\n').filter(Boolean),
      losses: form.losses.split('\n').filter(Boolean),
      insights: form.insights.split('\n').filter(Boolean),
    });
    setForm({ summary: '', wins: '', losses: '', insights: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-pixel)] text-xs text-accent-green">Reviews</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(v => !v)}>
          New Review
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded text-xs transition-colors ${
              tab === t.key ? 'bg-accent-green/20 text-accent-green' : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* New Review Form */}
      {showForm && (
        <Card glowColor="var(--accent-cyan)">
          <CardHeader>New {tab} Review</CardHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted uppercase block mb-1">Summary</label>
              <textarea
                className="w-full bg-transparent border border-card-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-accent-cyan"
                rows={2}
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="How did this period go?"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase block mb-1">Wins (one per line)</label>
              <textarea
                className="w-full bg-transparent border border-card-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-accent-green"
                rows={2}
                value={form.wins}
                onChange={e => setForm(f => ({ ...f, wins: e.target.value }))}
                placeholder="What went well?"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase block mb-1">Losses (one per line)</label>
              <textarea
                className="w-full bg-transparent border border-card-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-accent-red"
                rows={2}
                value={form.losses}
                onChange={e => setForm(f => ({ ...f, losses: e.target.value }))}
                placeholder="What could improve?"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase block mb-1">Insights (one per line)</label>
              <textarea
                className="w-full bg-transparent border border-card-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-accent-purple"
                rows={2}
                value={form.insights}
                onChange={e => setForm(f => ({ ...f, insights: e.target.value }))}
                placeholder="Key takeaways?"
              />
            </div>
            <Button variant="primary" onClick={handleSubmit}>Save Review</Button>
          </div>
        </Card>
      )}

      {/* Review List */}
      <div className="space-y-3">
        {filtered.map(r => (
          <Card key={r.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">{r.date}</span>
              <span className="text-[10px] text-accent-green uppercase">{r.type}</span>
            </div>
            <p className="text-sm mb-2">{r.summary}</p>
            {r.wins.length > 0 && (
              <div className="mb-1">
                <span className="text-[10px] text-accent-green uppercase">Wins: </span>
                {r.wins.map((w, i) => <span key={i} className="text-xs text-foreground/80">{w}{i < r.wins.length - 1 ? ' · ' : ''}</span>)}
              </div>
            )}
            {r.losses.length > 0 && (
              <div className="mb-1">
                <span className="text-[10px] text-accent-red uppercase">Losses: </span>
                {r.losses.map((l, i) => <span key={i} className="text-xs text-foreground/80">{l}{i < r.losses.length - 1 ? ' · ' : ''}</span>)}
              </div>
            )}
            {r.insights.length > 0 && (
              <div>
                <span className="text-[10px] text-accent-purple uppercase">Insights: </span>
                {r.insights.map((ins, i) => <span key={i} className="text-xs text-foreground/80">{ins}{i < r.insights.length - 1 ? ' · ' : ''}</span>)}
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No {tab} reviews yet.</p>
        )}
      </div>
    </div>
  );
}
