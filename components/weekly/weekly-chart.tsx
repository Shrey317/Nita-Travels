"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import type { WeeklyRow } from "@/lib/db/weekly";
import { formatZAR } from "@/lib/format";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import { chartColors, chartTooltipStyle, chartLabelStyle, chartCurrencyAxis } from "@/components/shared/chart-style";

export function WeeklyChart({ rows }: { rows: WeeklyRow[] }) {
  if (!rows.length) return <p className="py-16 text-center text-sm text-muted">No weekly records in this range.</p>;
  return (
    <div>
      <p className="mb-3 text-xs text-muted">Income, expenses, repairs and profit by ISO week. Exact figures are in the table below; repairs are included in expenses.</p>
      <ClientOnlyChart className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
            <XAxis dataKey="weekLabel" stroke={chartColors.text} tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(rows.length / 8) - 1)} />
            <YAxis stroke={chartColors.text} tickFormatter={chartCurrencyAxis} tick={{ fontSize: 11 }} width={58} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} formatter={(value: number) => formatZAR(value)} cursor={{ fill: chartColors.grid, opacity: 0.3 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke={chartColors.text} />
            <Bar isAnimationActive={false} dataKey="incomeCents" name="Income" fill={chartColors.income} maxBarSize={32} />
            <Bar isAnimationActive={false} dataKey="expenseCents" name="Expenses" fill={chartColors.expense} maxBarSize={32} />
            <Bar isAnimationActive={false} dataKey="repairsCents" name="Repairs (included)" fill={chartColors.repairs} maxBarSize={32} />
            <Bar isAnimationActive={false} dataKey="netProfitCents" name="Net Profit" fill={chartColors.profit} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ClientOnlyChart>
    </div>
  );
}
