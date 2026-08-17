"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MonthlyFinancials } from "@/lib/db/vehicles";

export function FinancialChart({ data }: { data: MonthlyFinancials[] }) {
  const chartData = data.map((d) => ({
    name: d.month,
    Income: d.incomeCents / 100,
    Expense: d.expenseCents / 100,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
        No financial data available for this vehicle.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.2} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted))" }} dy={10} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted))" }} 
            tickFormatter={(val) => `R${val}`} 
            width={60} 
          />
          <Tooltip 
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
            contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
            formatter={(value: number) => [`R ${value.toFixed(2)}`, undefined]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
