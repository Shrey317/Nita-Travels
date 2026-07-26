import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatZAR } from "@/lib/format";
import type { VehicleRankingRow } from "@/lib/db/analytics";

export function VehicleRankingTable({ rows }: { rows: VehicleRankingRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No vehicles yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Rank</TableHead>
          <TableHead>Vehicle ID</TableHead>
          <TableHead>Reg</TableHead>
          <TableHead className="text-right">Income (R)</TableHead>
          <TableHead className="text-right">Expense (R)</TableHead>
          <TableHead className="text-right">Repairs (R)</TableHead>
          <TableHead className="text-right">Net P/L (R)</TableHead>
          <TableHead className="text-right">Margin %</TableHead>
          <TableHead className="text-right">ROI on Purchase</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.vehicleId}>
            <TableCell className="font-mono text-sm">{r.rank}</TableCell>
            <TableCell>
              <Link href={`/vehicles/${r.vehicleId}`} className="font-medium text-teal hover:underline">
                {r.vehicleId}
              </Link>
            </TableCell>
            <TableCell>{r.registration}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.incomeCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.expenseCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(r.repairsCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm font-medium">{formatZAR(r.netProfitCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{r.marginLabel}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              {r.roiPercent === null ? "—" : `${r.roiPercent.toFixed(1)}%`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
