"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatZAR } from "@/lib/format";
import type { MonthlyRow } from "@/lib/db/monthly";

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
  const color = payload.netProfit >= 0 ? "#16A34A" : "#DC2626";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#FFFFFF" strokeWidth={1} />;
}

/** Skips zero-activity months entirely (SRS 15.10) — the table above is where every month in
 *  the fixed range shows up regardless of activity. */
export function MonthlyChart({ rows }: { rows: MonthlyRow[] }) {
  const chartData = rows
    .filter((r) => r.hasData)
    .map((r) => ({
      month: r.monthKey,
      income: r.incomeCents,
      expense: r.expenseCents,
      netProfit: r.netProfitCents,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted">
        No data to chart yet.
      </div>
    );
  }

  return (
    <div className="h-80 rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748B" />
          <YAxis tickFormatter={formatAxisTick} tick={{ fontSize: 12 }} stroke="#64748B" width={56} />
          <Tooltip formatter={(value: number) => formatZAR(value)} labelStyle={{ color: "#0F172A" }} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#0D9488" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#0F2540" radius={[4, 4, 0, 0]} />
          <Line dataKey="netProfit" name="Net P/L" stroke="#94A3B8" strokeWidth={2} dot={<NetProfitDot />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
