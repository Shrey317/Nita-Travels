"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import { chartColors, chartCurrencyAxis, chartLabelStyle, chartTooltipStyle } from "@/components/shared/chart-style";
import { formatZAR } from "@/lib/format";
import type { PeriodAnalytics } from "@/lib/analytics";

export function PeriodTrendChart({ rows }: { rows: PeriodAnalytics["monthly"] }) {
  return <ClientOnlyChart className="h-72 rounded-card border bg-card p-3">
    <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} accessibilityLayer margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: chartColors.text }} /><YAxis tickFormatter={chartCurrencyAxis} tick={{ fontSize: 11, fill: chartColors.text }} width={60} />
      <Tooltip formatter={(value: number) => formatZAR(value)} contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} /><Legend />
      <Line isAnimationActive={false} type="linear" name="Revenue" dataKey="incomeCents" stroke={chartColors.income} strokeWidth={2} />
      <Line isAnimationActive={false} type="linear" name="Expenses" dataKey="expenseCents" stroke={chartColors.expense} strokeWidth={2} strokeDasharray="5 3" />
      <Line isAnimationActive={false} type="linear" name="Profit" dataKey="netProfitCents" stroke={chartColors.profit} strokeWidth={2} />
    </LineChart></ResponsiveContainer>
  </ClientOnlyChart>;
}
