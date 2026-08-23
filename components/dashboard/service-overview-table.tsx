import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatKm } from "@/lib/format";
import { badgeVariant, badgeLabel } from "@/lib/service";
import { EmptyState } from "@/components/shared/empty-state";
import { Wrench } from "lucide-react";
import type { VehicleServiceRow } from "@/lib/db/service";

/** SRS 15.1: no service transaction with mileageKm -> show "—" for date/km and NEEDS_DATA status.
 *  lib/service.ts's guard already guarantees that, so this component just renders what it's given. */
export function ServiceOverviewTable({ rows }: { rows: VehicleServiceRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No service records"
        description="No service records found. Start logging mileage and repairs to track service schedules."
        icon={Wrench}
      />
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
            <TableCell>
              <Badge variant={badgeVariant[row.status]}>{badgeLabel[row.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
