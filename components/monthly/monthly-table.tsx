import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatZAR, formatMargin, formatKm } from "@/lib/format";
import { summarizePeriods } from "@/lib/periods";
import type { MonthlyRow } from "@/lib/db/monthly";

/** Shows every month in the fixed range, including zero-activity ones (SRS 13.9, 15.10) — the
 *  chart is the one that skips empty months, not this table. */
export function MonthlyTable({ rows }: { rows: MonthlyRow[] }) {
  const totals = summarizePeriods(rows);

  return (
    <Table className="[&_td]:whitespace-nowrap">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Month</TableHead>
          <TableHead className="text-right">Income (R)</TableHead>
          <TableHead className="text-right">Expense (R)</TableHead>
          <TableHead className="text-right">Repairs (R)</TableHead>
          <TableHead className="text-right">Net Profit (R)</TableHead>
          <TableHead className="text-right">Margin %</TableHead>
          <TableHead className="text-right">Maintenance</TableHead>
          <TableHead className="text-right">Mileage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.monthKey}>
            <TableCell className="whitespace-nowrap font-medium">{r.monthKey}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.incomeCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.expenseCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.repairsCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.netProfitCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{r.marginLabel}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.maintenanceCents)}</TableCell>
            <TableCell className="text-right whitespace-nowrap text-sm">{formatKm(r.mileageKm)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="hover:bg-transparent">
          <TableCell>Grand Total</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(totals.incomeCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(totals.expenseCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(totals.repairsCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(totals.netProfitCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatMargin(totals.incomeCents, totals.expenseCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(totals.maintenanceCents)}</TableCell>
          <TableCell className="text-right whitespace-nowrap text-sm">{formatKm(totals.mileageKm)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
