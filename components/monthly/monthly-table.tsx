import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatZAR, formatMargin, formatKm } from "@/lib/format";
import { summarizePeriods } from "@/lib/periods";
import type { MonthlyRow } from "@/lib/db/monthly";

/** Shows every month in the fixed range, including zero-activity ones (SRS 13.9, 15.10) — the
 *  chart is the one that skips empty months, not this table. */
export function MonthlyTable({ rows }: { rows: MonthlyRow[] }) {
  const totals = summarizePeriods(rows);

  return (
    <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
      <Table className="[&_td]:whitespace-nowrap">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-surface-elevated/50">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Month</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Income (R)</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Expense (R)</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Repairs (R)</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Net Profit (R)</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Margin %</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Maintenance</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Mileage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border-subtle">
          {rows.map((r) => (
            <TableRow key={r.monthKey} className="hover:bg-surface-elevated/50 transition-colors">
              <TableCell className="whitespace-nowrap font-bold text-white">{r.monthKey}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-status-success">{formatZAR(r.incomeCents)}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatZAR(r.expenseCents)}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-error">{formatZAR(r.repairsCents)}</TableCell>
              <TableCell className={`text-right font-mono-figures text-sm font-semibold ${r.netProfitCents >= 0 ? "text-status-success" : "text-error"}`}>{formatZAR(r.netProfitCents)}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{r.marginLabel}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatZAR(r.maintenanceCents)}</TableCell>
              <TableCell className="text-right whitespace-nowrap font-mono-figures text-sm text-ink-secondary">{formatKm(r.mileageKm)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent bg-surface-elevated/80 border-t-2 border-border-subtle">
            <TableCell className="font-bold text-white">Grand Total</TableCell>
            <TableCell className="text-right font-mono-figures text-sm font-bold text-status-success">{formatZAR(totals.incomeCents)}</TableCell>
            <TableCell className="text-right font-mono-figures text-sm font-bold text-white">{formatZAR(totals.expenseCents)}</TableCell>
            <TableCell className="text-right font-mono-figures text-sm font-bold text-error">{formatZAR(totals.repairsCents)}</TableCell>
            <TableCell className={`text-right font-mono-figures text-sm font-bold ${totals.netProfitCents >= 0 ? "text-status-success" : "text-error"}`}>{formatZAR(totals.netProfitCents)}</TableCell>
            <TableCell className="text-right font-mono-figures text-sm font-bold text-white">{formatMargin(totals.incomeCents, totals.expenseCents)}</TableCell>
            <TableCell className="text-right font-mono-figures text-sm font-bold text-white">{formatZAR(totals.maintenanceCents)}</TableCell>
            <TableCell className="text-right whitespace-nowrap font-mono-figures text-sm font-bold text-white">{formatKm(totals.mileageKm)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
