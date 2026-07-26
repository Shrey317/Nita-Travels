import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatZAR } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { CategoryBreakdownRow } from "@/lib/db/analytics";

export function CategoryBreakdownTable({ rows }: { rows: CategoryBreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No transactions yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Income (R)</TableHead>
          <TableHead className="text-right">Expense (R)</TableHead>
          <TableHead className="text-right">Net (R)</TableHead>
          <TableHead className="text-right">% of Total Expense</TableHead>
          <TableHead className="text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.category}>
            <TableCell className="font-medium">{CATEGORY_LABELS[r.category] ?? r.category}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.incomeCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.expenseCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.netCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              {r.percentOfTotalExpense === null ? "—" : `${r.percentOfTotalExpense.toFixed(1)}%`}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{r.count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
