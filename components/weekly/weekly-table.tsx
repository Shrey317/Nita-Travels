import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatZAR, formatMargin, formatKm } from "@/lib/format";
import { summarizePeriods } from "@/lib/periods";
import type { WeeklyRow } from "@/lib/db/weekly";

interface WeeklyTableProps {
  rows: WeeklyRow[];
}

export function WeeklyTable({ rows }: WeeklyTableProps) {
  const { incomeCents: totalIncome, expenseCents: totalExpenses, repairsCents: totalRepairs, netProfitCents: totalProfit, mileageKm, maintenanceCents } = summarizePeriods(rows);
  const overallMargin = formatMargin(totalIncome, totalExpenses);

  return (
    <div className="rounded-md border bg-card">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-surface-secondary backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="w-[200px]">Week</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Repairs</TableHead>
              <TableHead className="text-right">Net Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Maintenance</TableHead>
              <TableHead className="text-right">Mileage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted">
                  No data available for this range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.weekKey}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{row.weekLabel}</span>
                      <span className="text-xs text-muted font-normal">
                        {row.weekStart} – {row.weekEnd}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatZAR(row.incomeCents)}</TableCell>
                  <TableCell className="text-right">{formatZAR(row.expenseCents)}</TableCell>
                  <TableCell className="text-right">{formatZAR(row.repairsCents)}</TableCell>
                  <TableCell className={`text-right font-medium ${row.netProfitCents < 0 ? "text-status-error" : ""}`}>
                    {formatZAR(row.netProfitCents)}
                  </TableCell>
                  <TableCell className="text-right text-muted">{row.marginLabel}</TableCell>
                  <TableCell className="text-right">{formatZAR(row.maintenanceCents)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatKm(row.mileageKm)}</TableCell>
                </TableRow>
              ))
            )}
            {rows.length > 0 && (
              <TableRow className="bg-surface-secondary font-bold hover:bg-surface-secondary">
                <TableCell>Grand Total</TableCell>
                <TableCell className="text-right">{formatZAR(totalIncome)}</TableCell>
                <TableCell className="text-right">{formatZAR(totalExpenses)}</TableCell>
                <TableCell className="text-right">{formatZAR(totalRepairs)}</TableCell>
                <TableCell className={`text-right ${totalProfit < 0 ? "text-status-error" : ""}`}>
                  {formatZAR(totalProfit)}
                </TableCell>
                <TableCell className="text-right">{overallMargin}</TableCell>
                <TableCell className="text-right">{formatZAR(maintenanceCents)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatKm(mileageKm)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
