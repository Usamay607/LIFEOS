import type { RunwayResult } from "@los/types";
import { compactCurrencyFormatter } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RunwayCard({ runway }: { runway: RunwayResult }) {
  const danger = runway.monthsOfFreedom < 6;

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div>
          <CardTitle>Freedom Runway</CardTitle>
          <p className="mt-1 text-xs text-white/60">Main number uses spendable liquid cash and {runway.burnLabel}.</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Liquid Cash</p>
            <p className="text-lg font-semibold text-white">{compactCurrencyFormatter.format(runway.liquidAssets)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Reserved</p>
            <p className="text-lg font-semibold text-white">{compactCurrencyFormatter.format(runway.reservedCashTotal)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Runway Cash</p>
            <p className="text-lg font-semibold text-white">{compactCurrencyFormatter.format(runway.availableRunwayCash)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Active Burn</p>
            <p className="text-lg font-semibold text-white">{compactCurrencyFormatter.format(runway.monthlyBurn)}</p>
            <p className="mt-1 text-[11px] text-white/45">Bills floor {compactCurrencyFormatter.format(runway.monthlyCommittedBills)}</p>
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
