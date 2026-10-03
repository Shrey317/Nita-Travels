import { Card, CardContent } from "@/components/ui/card";
import { formatZAR, formatMargin } from "@/lib/format";
import { summarizePeriods } from "@/lib/periods";
import type { WeeklyRow } from "@/lib/db/weekly";

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

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
      {/* Totals */}
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase">Total Income</p>
          <p className="text-lg font-bold">{formatZAR(totalIncome)}</p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase">Total Expenses</p>
          <p className="text-lg font-bold">{formatZAR(totalExpenses)}</p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase">Total Repairs</p>
          <p className="text-lg font-bold">{formatZAR(totalRepairs)}</p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase">Net Profit</p>
          <p className={`text-lg font-bold ${totalProfit < 0 ? "text-status-error" : "text-emerald-600 dark:text-emerald-500"}`}>
            {formatZAR(totalProfit)}
          </p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase">Overall Margin</p>
          <p className="text-lg font-bold">{overallMarginLabel}</p>
        </CardContent>
      </Card>

      {/* Averages */}
      <Card className="col-span-2 md:col-span-1 lg:col-span-1 bg-surface-secondary">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase text-nowrap">Avg Wk Income</p>
          <p className="text-lg font-bold">{formatZAR(avgIncome)}</p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1 bg-surface-secondary">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase text-nowrap">Avg Wk Expense</p>
          <p className="text-lg font-bold">{formatZAR(avgExpense)}</p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1 bg-surface-secondary">
        <CardContent className="p-4 flex flex-col justify-center h-full space-y-1">
          <p className="text-xs font-medium text-muted uppercase text-nowrap">Avg Wk Profit</p>
          <p className={`text-lg font-bold ${avgProfit < 0 ? "text-status-error" : "text-emerald-600 dark:text-emerald-500"}`}>
            {formatZAR(avgProfit)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
