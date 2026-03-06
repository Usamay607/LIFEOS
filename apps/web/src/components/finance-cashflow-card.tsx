import type { HomeDashboardData } from "@los/types";
import { compactCurrencyFormatter, currencyFormatter, daysUntil, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinanceCardProps {
  data: HomeDashboardData;
}

export function FinanceCashflowCard({ data }: FinanceCardProps) {
  return (
    <Card className="lg:col-span-8">
      <CardHeader>
        <CardTitle>Finances & Cashflow</CardTitle>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-md bg-white/10 px-2 py-1">AUD</span>
          <span className="rounded-md bg-emerald-400/20 px-2 py-1 text-emerald-100">Live focus card</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Current Net Worth</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-300">{currencyFormatter.format(data.runway.netWorth)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Liquid Assets</p>
            <p className="mt-1 text-xl font-medium text-emerald-200">{currencyFormatter.format(data.runway.liquidAssets)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-white/65">Months of Freedom</p>
            <p className="mt-1 text-xl font-medium text-cyan-200">{data.runway.monthsOfFreedom} months</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/20 bg-slate-950/40 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.08em] text-white/70">Flow pulse</p>
            <div className="space-y-3">
              {[
                ["Business Revenue", 72],
                ["Investment Income", 35],
                ["Salary", 50],
                ["Business Expenses", 40],
                ["Personal Spending", 48],
                ["Savings", 58],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-xs text-white/75">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-white/70">Pending Transactions</p>
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
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-white/70">Top Upcoming Expenses</p>
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
