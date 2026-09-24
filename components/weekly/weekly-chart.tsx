"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatZAR } from "@/lib/format";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import type { WeeklyRow } from "@/lib/db/weekly";

function formatAxisTick(cents: number): string {
  return `R${Math.round(cents / 100 / 1000)}k`;
}

interface NetProfitDotProps {
  cx?: number;
  cy?: number;
  payload?: { netProfit: number };
}

function NetProfitDot({ cx, cy, payload }: NetProfitDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const color = payload.netProfit >= 0 ? "#16A34A" : "#DC2626";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#FFFFFF" strokeWidth={1} />;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Custom tooltip to show the week dates if we want, or just the label.
    // The payload usually contains the data object.
    const dataObj = payload[0].payload;
    return (
      <div className="bg-white border border-border p-2 rounded shadow-sm text-sm">
        <p className="font-semibold text-[#0F172A] mb-1">
          {label} ({dataObj.weekStart} – {dataObj.weekEnd})
        </p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatZAR(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function WeeklyChart({ rows }: { rows: WeeklyRow[] }) {
  const chartData = rows.map((r) => ({
    week: r.weekKey,
    weekStart: r.weekStart,
    weekEnd: r.weekEnd,
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

  // To prevent overlapping ticks, we can use an interval or minTickGap
  return (
    <ClientOnlyChart className="h-80 rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12 }} 
            stroke="#64748B" 
            minTickGap={20}
          />
          <YAxis tickFormatter={formatAxisTick} tick={{ fontSize: 12 }} stroke="#64748B" width={56} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#0D9488" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#0F2540" radius={[4, 4, 0, 0]} />
          <Line dataKey="netProfit" name="Net P/L" stroke="#94A3B8" strokeWidth={2} dot={<NetProfitDot />} />
        </ComposedChart>
      </ResponsiveContainer>
    </ClientOnlyChart>
  );
}
