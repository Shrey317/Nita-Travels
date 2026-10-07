import { Card, CardContent } from "@/components/ui/card";
import { formatZAR, formatMargin } from "@/lib/format";
import { summarizePeriods } from "@/lib/periods";
import type { WeeklyRow } from "@/lib/db/weekly";
import { TrendingUp, TrendingDown, Wrench, DollarSign, Percent, BarChart3, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface WeeklySummaryProps {
  rows: WeeklyRow[];
}

export function WeeklySummary({ rows }: WeeklySummaryProps) {
  const { incomeCents: totalIncome, expenseCents: totalExpenses, repairsCents: totalRepairs, netProfitCents: totalProfit } = summarizePeriods(rows);
  const overallMarginLabel = formatMargin(totalIncome, totalExpenses);

  const numWeeks = rows.length || 1; // prevent divide by zero
  const avgIncome = totalIncome / numWeeks;
  const avgExpense = totalExpenses / numWeeks;
  const avgProfit = totalProfit / numWeeks;

  const summaryItems = [
    { label: "Total Income", value: formatZAR(totalIncome), icon: TrendingUp, color: "text-status-success", bgColor: "bg-status-success/10 border-status-success/20" },
    { label: "Total Expenses", value: formatZAR(totalExpenses), icon: TrendingDown, color: "text-primary", bgColor: "bg-primary/10 border-primary/20" },
    { label: "Total Repairs", value: formatZAR(totalRepairs), icon: Wrench, color: "text-error", bgColor: "bg-error/10 border-error/20" },
    { label: "Net Profit", value: formatZAR(totalProfit), icon: DollarSign, color: totalProfit < 0 ? "text-error" : "text-status-success", bgColor: totalProfit < 0 ? "bg-error/10 border-error/20" : "bg-status-success/10 border-status-success/20" },
    { label: "Overall Margin", value: overallMarginLabel, icon: Percent, color: "text-white", bgColor: "bg-primary/10 border-primary/20" },
  ];

  const avgItems = [
    { label: "Avg Wk Income", value: formatZAR(avgIncome), icon: ArrowUpRight, color: "text-status-success", bgColor: "bg-status-success/10 border-status-success/20" },
    { label: "Avg Wk Expense", value: formatZAR(avgExpense), icon: ArrowDownRight, color: "text-ink-secondary", bgColor: "bg-surface-elevated border-border-subtle" },
    { label: "Avg Wk Profit", value: formatZAR(avgProfit), icon: BarChart3, color: avgProfit < 0 ? "text-error" : "text-status-success", bgColor: avgProfit < 0 ? "bg-error/10 border-error/20" : "bg-status-success/10 border-status-success/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
      {summaryItems.map(({ label, value, icon: Icon, color, bgColor }) => (
        <Card key={label} className="bg-card border-border-subtle shadow-card-elevated col-span-2 md:col-span-1 lg:col-span-1">
          <CardContent className="p-4 flex flex-col justify-center h-full space-y-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${bgColor}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-lg font-bold font-mono-figures ${color}`}>{value}</p>
          </CardContent>
        </Card>
      ))}

      {avgItems.map(({ label, value, icon: Icon, color, bgColor }) => (
        <Card key={label} className="bg-card border-border-subtle shadow-card-elevated col-span-2 md:col-span-1 lg:col-span-1">
          <CardContent className="p-4 flex flex-col justify-center h-full space-y-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${bgColor}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider text-nowrap">{label}</p>
            </div>
            <p className={`text-lg font-bold font-mono-figures ${color}`}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
