'use client';
import { useEffect, useState } from 'react';
import { Trophy, TrendingDown, Lightbulb } from 'lucide-react';
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
  const { load, add, getByType } = useReviewStore();
  const [tab, setTab] = useState<ReviewType>('weekly');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ summary: '', wins: '', losses: '', insights: '' });

  useEffect(() => { load(); }, [load]);
  const filtered = getByType(tab);

  const handleSubmit = () => {
    add({
      type: tab, date: new Date().toISOString().slice(0, 10), summary: form.summary,
      wins: form.wins.split('\n').filter(Boolean), losses: form.losses.split('\n').filter(Boolean),
      insights: form.insights.split('\n').filter(Boolean),
    });
    setForm({ summary: '', wins: '', losses: '', insights: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Reviews</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(v => !v)}>New Review</Button>
      </div>

      <div className="flex gap-1 bg-surface rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-foreground'
            }`}>{t.label}</button>
        ))}
      </div>

      {showForm && (
        <Card glowColor="#06b6d4">
          <CardHeader>New {tab} Review</CardHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block mb-1">Summary</label>
              <textarea className="w-full bg-surface border border-card-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="How did this period go?" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block mb-1">Wins (one per line)</label>
              <textarea className="w-full bg-surface border border-card-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200" rows={2} value={form.wins} onChange={e => setForm(f => ({ ...f, wins: e.target.value }))} placeholder="What went well?" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block mb-1">Losses (one per line)</label>
              <textarea className="w-full bg-surface border border-card-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200" rows={2} value={form.losses} onChange={e => setForm(f => ({ ...f, losses: e.target.value }))} placeholder="What could improve?" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block mb-1">Insights (one per line)</label>
              <textarea className="w-full bg-surface border border-card-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2} value={form.insights} onChange={e => setForm(f => ({ ...f, insights: e.target.value }))} placeholder="Key takeaways?" />
            </div>
            <Button variant="primary" onClick={handleSubmit}>Save Review</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(r => (
          <Card key={r.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted">{r.date}</span>
              <span className="text-[10px] font-bold text-primary uppercase bg-blue-50 px-2 py-0.5 rounded-full">{r.type}</span>
            </div>
            <p className="text-sm font-medium mb-3">{r.summary}</p>
            {r.wins.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase mb-1"><Trophy size={10} /> Wins</div>
                {r.wins.map((w, i) => <div key={i} className="text-xs text-foreground/80 bg-green-50 rounded-lg px-2 py-1 mb-1">{w}</div>)}
              </div>
            )}
            {r.losses.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase mb-1"><TrendingDown size={10} /> Losses</div>
                {r.losses.map((l, i) => <div key={i} className="text-xs text-foreground/80 bg-red-50 rounded-lg px-2 py-1 mb-1">{l}</div>)}
              </div>
            )}
            {r.insights.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 uppercase mb-1"><Lightbulb size={10} /> Insights</div>
                {r.insights.map((ins, i) => <div key={i} className="text-xs text-foreground/80 bg-purple-50 rounded-lg px-2 py-1 mb-1">{ins}</div>)}
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted text-sm py-8">No {tab} reviews yet.</p>}
      </div>
    </div>
  );
}
