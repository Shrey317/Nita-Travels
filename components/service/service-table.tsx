import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatKm } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import type { VehicleServiceRowWithEstimate } from "@/lib/db/service";

/** Read-only, fully computed (SRS 15.6). Rows are already sorted OVERDUE -> DUE_SOON -> OK ->
 *  NEEDS_DATA by lib/db/service.ts. */
export function ServiceTable({ rows }: { rows: VehicleServiceRowWithEstimate[] }) {
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
          <TableHead>Vehicle ID</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead>Last Service Date</TableHead>
          <TableHead className="text-right">Mileage at Last Svc</TableHead>
          <TableHead className="text-right">Next Svc KM</TableHead>
          <TableHead className="text-right">Current KM</TableHead>
          <TableHead className="text-right">KM Remaining</TableHead>
          <TableHead className="text-right">Days to Next (est.)</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.vehicleId}>
            <TableCell>
              <Link href={`/vehicles/${row.vehicleId}`} className="font-medium text-teal hover:underline">
                {row.vehicleId}
              </Link>
            </TableCell>
            <TableCell>{row.registration}</TableCell>
            <TableCell>{row.lastServiceDate ? formatDate(row.lastServiceDate) : "—"}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(row.lastServiceMileageKm)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(row.nextSvcKm)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(row.currentMileageKm)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(row.kmRemaining)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{row.daysToNext === null ? "—" : row.daysToNext}</TableCell>
            <TableCell>
              <Badge variant={badgeVariant[row.status]}>{badgeLabel[row.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
