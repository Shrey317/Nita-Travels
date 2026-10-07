"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatZAR } from "@/lib/format";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import type { MonthlyRow } from "@/lib/db/monthly";
import { chartColors, chartTooltipStyle, chartLabelStyle } from "@/components/shared/chart-style";

function formatAxisTick(cents: number): string {
  return `R${Math.round(cents / 100 / 1000)}k`;
}

interface NetProfitDotProps {
  cx?: number;
  cy?: number;
  payload?: { netProfit: number };
}

/** Recharts' <Line> only takes a single stroke color, so "coloured green/red by value" (SRS
 *  15.10) is expressed through the dots rather than the connecting line — the line itself stays
 *  a neutral grey so it doesn't visually compete with the two bar series. */
function NetProfitDot({ cx, cy, payload }: NetProfitDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const color = payload.netProfit >= 0 ? "#18C98B" : "#F05252";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0A1628" strokeWidth={2} />;
}

export function MonthlyChart({ rows }: { rows: MonthlyRow[] }) {
  const chartData = rows
    .map((r) => ({
      month: r.monthKey,
      income: r.incomeCents,
      expense: r.expenseCents,
      netProfit: r.netProfitCents,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-border-subtle bg-card text-sm text-ink-secondary">
        No data to chart yet.
      </div>
    );
  }

  return (
    <ClientOnlyChart className="h-80 rounded-xl border border-border-subtle bg-card p-4 shadow-card-elevated">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart accessibilityLayer data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={chartColors.text} />
          <YAxis tickFormatter={formatAxisTick} tick={{ fontSize: 12 }} stroke={chartColors.text} width={56} />
          <Tooltip formatter={(value: number) => formatZAR(value)} contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} />
          <Legend />
          <Bar isAnimationActive={false} dataKey="income" name="Income" fill="#2F6BFF" radius={[4, 4, 0, 0]} />
          <Bar isAnimationActive={false} dataKey="expense" name="Expense" fill={chartColors.expense} radius={[4, 4, 0, 0]} />
          <Line isAnimationActive={false} dataKey="netProfit" name="Net P/L" stroke="#94A3B8" strokeWidth={2} dot={<NetProfitDot />} />
        </ComposedChart>
      </ResponsiveContainer>
    </ClientOnlyChart>
  );
}
