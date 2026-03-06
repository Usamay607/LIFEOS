import type { HomeDashboardData } from "@los/types";
import { compactCurrencyFormatter, currencyFormatter, daysUntil, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendWheel } from "@/components/spend-wheel";

interface FinanceCardProps {
  data: HomeDashboardData;
}

export function FinanceCashflowCard({ data }: FinanceCardProps) {
  const burnRows = data.financePulse.scenarios.map((scenario) => ({
    label: scenario.label,
    value: scenario.monthlyEquivalent,
    meta: `${scenario.runwayMonths.toFixed(1)} mo`,
    tone:
      scenario.basis === "LAST_7_DAYS"
        ? "bg-amber-300"
        : scenario.basis === "CURRENT_MONTH"
          ? "bg-cyan-300"
          : scenario.basis === "LAST_30_DAYS"
            ? "bg-rose-300"
            : "bg-emerald-300",
  }));
  const financeRows = [
    {
      label: "Income (30d)",
      value: data.financePulse.last30Income,
      meta: "cash in",
      tone: "bg-emerald-300",
    },
    {
      label: "Expenses (30d)",
      value: data.financePulse.last30Expenses,
      meta: "cash out",
      tone: "bg-rose-300",
    },
    {
      label: "This month",
      value: data.financePulse.currentMonthExpenses,
      meta:
        data.financePulse.currentMonthExpenses <= data.financePulse.previousMonthExpenses
          ? "tracking lower"
          : "tracking higher",
      tone:
        data.financePulse.currentMonthExpenses <= data.financePulse.previousMonthExpenses
          ? "bg-emerald-300"
          : "bg-amber-300",
    },
  ];
  const burnScaleBase = Math.max(...burnRows.map((row) => Math.abs(row.value)), 1);
  const financeScaleBase = Math.max(...financeRows.map((row) => Math.abs(row.value)), 1);

  return (
    <Card className="lg:col-span-8">
      <CardHeader>
        <div>
          <CardTitle>Finances</CardTitle>
          <p className="mt-1 text-xs text-white/60">Net worth, runway cash, bills, and burn all come from the same saved finance data.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-md bg-white/10 px-2 py-1">AUD</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Current Net Worth</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-300">{currencyFormatter.format(data.runway.netWorth)}</p>
            <p className="mt-1 text-xs text-white/55">
              Assets {compactCurrencyFormatter.format(data.runway.totalAssets)} · Liabilities {compactCurrencyFormatter.format(data.runway.totalLiabilities)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Liquid Cash</p>
            <p className="mt-1 text-xl font-medium text-emerald-200">{currencyFormatter.format(data.runway.liquidAssets)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Protected Cash</p>
            <p className="mt-1 text-xl font-medium text-amber-200">{currencyFormatter.format(data.runway.reservedCashTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Runway Cash</p>
            <p className="mt-1 text-xl font-medium text-cyan-200">{currencyFormatter.format(data.runway.availableRunwayCash)}</p>
            <p className="mt-1 text-xs text-white/55">{data.runway.buckets.length} cash buckets reserved</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Months of Freedom</p>
            <p className="mt-1 text-xl font-medium text-cyan-200">{data.runway.monthsOfFreedom} months</p>
            <p className="mt-1 text-xs text-white/55">Based on {data.runway.burnLabel}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SpendWheel items={data.financePulse.topExpenseCategories} />

          <div className="grid gap-4">
            <div className="rounded-2xl border border-emerald-300/20 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-white/70">Burn snapshot</p>
                  <p className="mt-1 text-sm text-white/60">
                    Each scenario uses spendable runway cash and never drops below your recurring bills floor.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {burnRows.map((row) => {
                  const width = Math.max(18, Math.round((Math.abs(row.value) / burnScaleBase) * 100));
                  return (
                    <div key={row.label}>
                      <div className="mb-1 flex justify-between text-xs text-white/75">
                        <span>{row.label}</span>
                        <span>
                          {compactCurrencyFormatter.format(row.value)} · {row.meta}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-white/70">Cashflow markers</p>
              {financeRows.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {financeRows.map((row) => {
                    const width = Math.max(18, Math.round((Math.abs(row.value) / financeScaleBase) * 100));
                    return (
                    <div key={row.label}>
                      <div className="mb-1 flex justify-between text-xs text-white/75">
                        <span>{row.label}</span>
                        <span>
                          {compactCurrencyFormatter.format(row.value)} · {row.meta}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <p className="text-sm text-white/55">No cashflow markers yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-white/70">Recent Expenses</p>
              {data.pendingTransactions.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {data.pendingTransactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between text-white/85">
                      <div>
                        <p>{transaction.category}</p>
                        <p className="text-xs text-white/55">{formatDate(transaction.date)}</p>
                      </div>
                      <p>{compactCurrencyFormatter.format(transaction.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/55">No recent expense entries yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-white/70">Upcoming Bills</p>
              <p className="mb-3 text-xs text-white/55">
                Recurring bills roll forward automatically. Monthly commitments floor: {compactCurrencyFormatter.format(data.runway.monthlyCommittedBills)}
              </p>
              {data.upcomingExpenses.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {data.upcomingExpenses.slice(0, 3).map((expense) => {
                    const days = daysUntil(expense.dueDate);
                    return (
                      <div key={expense.id} className="flex items-center justify-between rounded-lg px-2 py-1 text-white/85">
                        <div>
                          <p>{expense.bill}</p>
                          <p className={`text-xs ${days <= 2 ? "text-rose-200" : days <= 5 ? "text-amber-200" : "text-emerald-200"}`}>
                            Due in {days} day{days === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>{compactCurrencyFormatter.format(expense.amount)}</p>
                          <span
                            className={`mt-1 inline-block h-2.5 w-12 rounded-full ${days <= 2 ? "bg-rose-300" : days <= 5 ? "bg-amber-300" : "bg-emerald-300"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white/55">No upcoming bills saved.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
