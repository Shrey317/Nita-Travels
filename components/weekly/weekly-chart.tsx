"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { WeeklyRow } from "@/lib/db/weekly";

interface WeeklyChartProps {
  rows: WeeklyRow[];
}

export function WeeklyChart({ rows }: WeeklyChartProps) {
  const data = useMemo(() => {
    return rows.map((r) => ({
      weekLabel: r.weekLabel,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      income: r.incomeCents / 100,
      expenses: r.expenseCents / 100,
      repairs: r.repairsCents / 100,
      profit: r.netProfitCents / 100,
      margin: r.marginLabel,
      hasData: r.hasData,
    }));
  }, [rows]);

  const tickInterval = Math.max(1, Math.floor(data.length / 10)); // Ensure around 10 labels max on X-axis

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis 
            dataKey="weekLabel" 
            tick={{ fontSize: 12 }} 
            interval={tickInterval - 1} 
            tickMargin={10} 
            className="text-muted-foreground" 
          />
          <YAxis 
            tickFormatter={(val) => `R${val.toLocaleString("en-ZA")}`} 
            tick={{ fontSize: 12 }} 
            className="text-muted-foreground"
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length > 0 && payload[0]) {
                const { weekStart, weekEnd, margin } = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md space-y-2 min-w-[200px]">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{weekStart} – {weekEnd}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Income:</span>
                      <span className="font-medium text-right text-emerald-600">R{Number(payload[0]?.value || 0).toLocaleString("en-ZA")}</span>
                      
                      <span className="text-muted-foreground">Expenses:</span>
                      <span className="font-medium text-right text-destructive">R{Number(payload[1]?.value || 0).toLocaleString("en-ZA")}</span>
                      
                      <span className="text-muted-foreground">Repairs:</span>
                      <span className="font-medium text-right text-orange-500">R{Number(payload[2]?.value || 0).toLocaleString("en-ZA")}</span>
                      
                      <span className="text-muted-foreground font-medium pt-1 border-t">Profit:</span>
                      <span className={`font-bold text-right pt-1 border-t ${Number(payload[3]?.value || 0) < 0 ? "text-destructive" : "text-emerald-600"}`}>
                        R{Number(payload[3]?.value || 0).toLocaleString("en-ZA")}
                      </span>
                    </div>
                    <p className="text-xs text-right text-muted-foreground pt-1">Margin: {margin}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" opacity={0.2} />
          <Bar dataKey="income" name="Income" fill="hsl(var(--emerald-500) / 0.8)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive) / 0.8)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="repairs" name="Repairs" fill="hsl(var(--orange-500) / 0.8)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="profit" name="Net Profit" fill="hsl(var(--primary) / 0.8)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
