"use client";

import { Card } from "@/components/ui/card";
import { formatZAR } from "@/lib/format";
import { calculateChange } from "@/lib/finance";
import type { AnalyticsReport } from "@/lib/db/analytics";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { chartColors, chartTooltipStyle, chartLabelStyle, chartCurrencyAxis } from "@/components/shared/chart-style";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Wallet, Receipt, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinancialOverview({ report }: { report: AnalyticsReport }) {
  const { current, previous } = report;
  
  const getChangeNode = (val: number | null, prev: number | null, inverted: boolean = false) => {
    const change = calculateChange(val, prev);
    if (change.delta === null || change.percent === null) {
      return <span className="text-muted text-xs">No prior data</span>;
    }
    
    const isPositive = change.delta > 0;
    const isNegative = change.delta < 0;
    
    // For expenses, going down is good (success), going up is bad (error)
    const isGood = inverted ? isNegative : isPositive;
    const isBad = inverted ? isPositive : isNegative;
    
    return (
      <div className={cn("flex items-center gap-1 text-[11px] font-semibold", 
        isGood && "text-status-success", 
        isBad && "text-error",
        !isGood && !isBad && "text-muted"
      )}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : isNegative ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        {Math.abs(change.percent).toFixed(1)}% <span className="text-muted font-medium ml-1">from previous</span>
      </div>
    );
  };

  const metrics = [
    { 
      label: "Revenue", 
      value: current.totals.incomeCents, 
      prev: previous.totals.incomeCents,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      label: "Expenses", 
      value: current.totals.expenseCents, 
      prev: previous.totals.expenseCents,
      icon: Receipt,
      color: "text-error",
      bg: "bg-error/10",
      inverted: true // Lower is better
    },
    { 
      label: "Net Profit", 
      value: current.totals.netProfitCents, 
      prev: previous.totals.netProfitCents,
      icon: TrendingUp,
      color: "text-status-success",
      bg: "bg-status-success/10"
    },
    { 
      label: "Profit Margin", 
      value: current.totals.margin, 
      prev: previous.totals.margin,
      icon: Percent,
      color: "text-info",
      bg: "bg-info/10",
      isRatio: true
    },
  ];

  return (
    <Card className="col-span-1 xl:col-span-2 overflow-hidden flex flex-col h-full bg-card border-border-subtle shadow-card-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle p-5 bg-gradient-to-r from-surface-elevated/50 to-transparent">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-white tracking-tight">Financial Overview</h2>
        </div>
      </div>
      
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border-subtle bg-surface-elevated/30">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-2 rounded-xl bg-card p-4 border border-border-subtle/50 shadow-soft">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", m.bg)}>
                <m.icon className={cn("h-3.5 w-3.5", m.color)} />
              </div>
              <span className="text-xs font-medium text-ink-secondary">{m.label}</span>
            </div>
            
            <div className="text-2xl font-bold text-white tracking-tight font-mono-figures">
              {m.value === null ? "—" : m.isRatio ? `${(m.value * 100).toFixed(1)}%` : formatZAR(m.value)}
            </div>
            
            <div className="mt-auto pt-2">
              {getChangeNode(m.value, m.prev, m.inverted)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 p-5 min-h-[300px]">
        {current.monthly.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">
            No financial records in this period.
          </div>
        ) : (
          <ClientOnlyChart className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={current.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.income} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.income} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.expense} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.expense} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="month" stroke={chartColors.text} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={chartCurrencyAxis} stroke={chartColors.text} tick={{ fontSize: 11 }} width={58} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} formatter={(value: number) => formatZAR(value)} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px" }} iconType="circle" />
                <Area type="monotone" dataKey="incomeCents" name="Revenue" stroke={chartColors.income} strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, fill: chartColors.income, stroke: "#050A14", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="expenseCents" name="Expenses" stroke={chartColors.expense} strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, fill: chartColors.expense, stroke: "#050A14", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnlyChart>
        )}
      </div>
    </Card>
  );
}
