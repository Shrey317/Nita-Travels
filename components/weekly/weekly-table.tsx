import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatZAR, formatMargin } from "@/lib/format";
import type { WeeklyRow } from "@/lib/db/weekly";

interface WeeklyTableProps {
  rows: WeeklyRow[];
}

export function WeeklyTable({ rows }: WeeklyTableProps) {
  const totalIncome = rows.reduce((sum, r) => sum + r.incomeCents, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.expenseCents, 0);
  const totalRepairs = rows.reduce((sum, r) => sum + r.repairsCents, 0);
  const totalProfit = totalIncome - totalExpenses;
  const overallMargin = formatMargin(totalIncome, totalExpenses);

  return (
    <div className="rounded-md border bg-card">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="w-[200px]">Week</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Repairs</TableHead>
              <TableHead className="text-right">Net Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No data available for this range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.weekKey} className={!row.hasData ? "opacity-50" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{row.weekLabel}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {row.weekStart} – {row.weekEnd}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatZAR(row.incomeCents)}</TableCell>
                  <TableCell className="text-right">{formatZAR(row.expenseCents)}</TableCell>
                  <TableCell className="text-right">{formatZAR(row.repairsCents)}</TableCell>
                  <TableCell className={`text-right font-medium ${row.netProfitCents < 0 ? "text-destructive" : ""}`}>
                    {formatZAR(row.netProfitCents)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.marginLabel}</TableCell>
                </TableRow>
              ))
            )}
            {rows.length > 0 && (
              <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                <TableCell>Grand Total</TableCell>
                <TableCell className="text-right">{formatZAR(totalIncome)}</TableCell>
                <TableCell className="text-right">{formatZAR(totalExpenses)}</TableCell>
                <TableCell className="text-right">{formatZAR(totalRepairs)}</TableCell>
                <TableCell className={`text-right ${totalProfit < 0 ? "text-destructive" : ""}`}>
                  {formatZAR(totalProfit)}
                </TableCell>
                <TableCell className="text-right">{overallMargin}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
