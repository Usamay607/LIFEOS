import type { RunwayResult } from "@los/types";
import { compactCurrencyFormatter } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RunwayCard({ runway }: { runway: RunwayResult }) {
  const danger = runway.monthsOfFreedom < 6;

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Freedom Runway</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Liquid Assets</p>
            <p className="text-lg font-semibold text-white">{compactCurrencyFormatter.format(runway.liquidAssets)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Monthly Burn</p>
            <p className="text-lg font-semibold text-white">{compactCurrencyFormatter.format(runway.monthlyBurn)}</p>
          </div>
          <div
            className={`rounded-xl border p-3 ${
              danger ? "border-rose-300/60 bg-rose-300/20" : "border-emerald-300/40 bg-emerald-300/10"
            }`}
          >
            <p className="text-xs text-white/70">Months of Freedom</p>
            <p className="text-lg font-semibold text-white">{runway.monthsOfFreedom.toFixed(1)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
