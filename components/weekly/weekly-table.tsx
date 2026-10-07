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
    <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-surface-elevated/90 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="w-[200px] text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Week</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Income</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Expenses</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Repairs</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Net Profit</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Margin</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Maintenance</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Mileage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-subtle">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-ink-secondary">
                  No data available for this range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.weekKey} className="hover:bg-surface-elevated/50 transition-colors">
                  <TableCell className="font-bold text-white">
                    <div className="flex flex-col">
                      <span>{row.weekLabel}</span>
                      <span className="text-xs text-muted font-normal">
                        {row.weekStart} – {row.weekEnd}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-status-success">{formatZAR(row.incomeCents)}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatZAR(row.expenseCents)}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-error">{formatZAR(row.repairsCents)}</TableCell>
                  <TableCell className={`text-right font-mono-figures text-sm font-semibold ${row.netProfitCents < 0 ? "text-error" : "text-status-success"}`}>
                    {formatZAR(row.netProfitCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-muted">{row.marginLabel}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatZAR(row.maintenanceCents)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-mono-figures text-sm text-ink-secondary">{formatKm(row.mileageKm)}</TableCell>
                </TableRow>
              ))
            )}
            {rows.length > 0 && (
              <TableRow className="bg-surface-elevated/80 font-bold hover:bg-surface-elevated/80 border-t-2 border-border-subtle">
                <TableCell className="text-white">Grand Total</TableCell>
                <TableCell className="text-right font-mono-figures text-sm text-status-success">{formatZAR(totalIncome)}</TableCell>
                <TableCell className="text-right font-mono-figures text-sm text-white">{formatZAR(totalExpenses)}</TableCell>
                <TableCell className="text-right font-mono-figures text-sm text-error">{formatZAR(totalRepairs)}</TableCell>
                <TableCell className={`text-right font-mono-figures text-sm ${totalProfit < 0 ? "text-error" : "text-status-success"}`}>
                  {formatZAR(totalProfit)}
                </TableCell>
                <TableCell className="text-right font-mono-figures text-sm text-white">{overallMargin}</TableCell>
                <TableCell className="text-right font-mono-figures text-sm text-white">{formatZAR(maintenanceCents)}</TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono-figures text-sm text-white">{formatKm(mileageKm)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
