import type { FinanceBreakdownItem } from "@los/types";
import { compactCurrencyFormatter } from "@/lib/format";

const SEGMENT_COLORS = ["#34d399", "#38bdf8", "#f472b6", "#fbbf24", "#a78bfa", "#fb7185"];

export function SpendWheel({
  items,
  title = "Where money goes",
}: {
  items: FinanceBreakdownItem[];
  title?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const segments = items.length > 0 ? items : [{ label: "No data", total: 1, sharePercent: 100 }];
  const gradientStops = segments
    .reduce<{ stops: string[]; currentAngle: number }>(
      (accumulator, item, index) => {
      const angle = total > 0 ? (item.total / total) * 360 : 360 / segments.length;
      const start = accumulator.currentAngle;
      const end = accumulator.currentAngle + angle;
      const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
      accumulator.stops.push(`${color} ${start}deg ${end}deg`);
      accumulator.currentAngle = end;
      return accumulator;
    },
    { stops: [], currentAngle: 0 },
  )
    .stops
    .join(", ");

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.08em] text-white/70">{title}</p>
        <p className="mt-1 text-sm text-white/55">Top categories over the last 90 days.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
        <div className="relative mx-auto h-40 w-40">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-35 animate-[spin_18s_linear_infinite]"
            style={{ background: `conic-gradient(${gradientStops})` }}
          />
          <div
            className="absolute inset-2 rounded-full border border-white/10 shadow-[0_0_40px_rgba(15,23,42,0.6)]"
            style={{ background: `conic-gradient(${gradientStops})` }}
          />
          <div className="absolute inset-[26%] rounded-full border border-white/10 bg-slate-950/90 backdrop-blur">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">90d spend</p>
              <p className="mt-1 text-lg font-semibold text-white">{compactCurrencyFormatter.format(total)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_16px_currentColor]"
                    style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length], color: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                  />
                  <div>
                    <p className="text-white/88">{item.label}</p>
                    <p className="text-xs text-white/50">{item.sharePercent}% of spend</p>
                  </div>
                </div>
                <p className="text-white/82">{compactCurrencyFormatter.format(item.total)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/55">Add expense entries to populate the spend wheel.</p>
          )}
        </div>
      </div>
    </div>
  );
}
