"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatZAR } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import type { CategoryBreakdownRow } from "@/lib/db/analytics";

const PIE_COLORS = ["#0D9488", "#0F2540", "#CA8A04", "#DC2626", "#14B8A6", "#1A3557", "#64748B", "#16A34A", "#7C3AED"];

function pieColor(index: number): string {
  return PIE_COLORS[index % PIE_COLORS.length] ?? "#64748B";
}

/** Categories with expense > 0 only (SRS 15.11) — a category that's only ever generated income
 *  (e.g. Income itself) has nothing to show on an expense breakdown. */
export function ExpenseByCategoryPie({ rows }: { rows: CategoryBreakdownRow[] }) {
  const chartData = rows
    .filter((r) => r.expenseCents > 0)
    .map((r) => ({ name: CATEGORY_LABELS[r.category] ?? r.category, value: r.expenseCents }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted">
        No expenses to chart yet.
      </div>
    );
  }

  return (
    <ClientOnlyChart className="h-72 rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={pieColor(index)} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatZAR(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ClientOnlyChart>
  );
}
