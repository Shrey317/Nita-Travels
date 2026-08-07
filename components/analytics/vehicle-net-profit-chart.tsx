"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatZAR } from "@/lib/format";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import type { VehicleRankingRow } from "@/lib/db/analytics";

function formatAxisTick(cents: number): string {
  return `R${Math.round(cents / 100 / 1000)}k`;
}

/** Unlike the Monthly chart's Line, a Bar's per-entry colour is natively supported via <Cell>
 *  children — no dot-only workaround needed here for "green/red by value" (SRS 15.11). */
export function VehicleNetProfitChart({ rows }: { rows: VehicleRankingRow[] }) {
  const chartData = rows.map((r) => ({ vehicleId: r.vehicleId, netProfit: r.netProfitCents }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted">
        No data to chart yet.
      </div>
    );
  }

  return (
    <ClientOnlyChart className="h-72 rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="vehicleId" tick={{ fontSize: 12 }} stroke="#64748B" />
          <YAxis tickFormatter={formatAxisTick} tick={{ fontSize: 12 }} stroke="#64748B" width={56} />
          <Tooltip formatter={(value: number) => formatZAR(value)} />
          <Bar dataKey="netProfit" name="Net P/L" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.vehicleId} fill={entry.netProfit >= 0 ? "#16A34A" : "#DC2626"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ClientOnlyChart>
  );
}
