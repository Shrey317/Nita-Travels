"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { MonthlyFinancials } from "@/lib/db/vehicles";
import { formatZAR } from "@/lib/format";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import { chartColors, chartTooltipStyle, chartLabelStyle, chartCurrencyAxis } from "@/components/shared/chart-style";

export function FinancialChart({ data }: { data: MonthlyFinancials[] }) {
  if (!data.length) return <div className="rounded-card border border-dashed border-border p-12 text-center text-sm text-muted">No financial records in this period. Choose a wider date range or log a transaction.</div>;
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <ClientOnlyChart className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
            <XAxis dataKey="month" stroke={chartColors.text} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={chartCurrencyAxis} stroke={chartColors.text} tick={{ fontSize: 11 }} width={58} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} formatter={(value: number) => formatZAR(value)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar isAnimationActive={false} dataKey="incomeCents" name="Income" fill={chartColors.income} maxBarSize={40} />
            <Bar isAnimationActive={false} dataKey="expenseCents" name="Expenses" fill={chartColors.expense} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </ClientOnlyChart>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-brand-blue">View monthly figures</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Monthly financial figures for the selected records</caption>
            <thead><tr className="border-b border-border"><th className="p-2 text-left">Month</th><th className="p-2 text-right">Income</th><th className="p-2 text-right">Expenses</th></tr></thead>
            <tbody>{data.map((row) => <tr key={row.month} className="border-b border-border last:border-0"><th scope="row" className="p-2 text-left font-normal">{row.month}</th><td className="p-2 text-right tabular-nums">{formatZAR(row.incomeCents)}</td><td className="p-2 text-right tabular-nums">{formatZAR(row.expenseCents)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
