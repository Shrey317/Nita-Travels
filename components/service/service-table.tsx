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

  const grouped = {
    OVERDUE: rows.filter((r) => r.status === "OVERDUE"),
    DUE_SOON: rows.filter((r) => r.status === "DUE_SOON"),
    OK: rows.filter((r) => r.status === "OK"),
    NEEDS_DATA: rows.filter((r) => r.status === "NEEDS_DATA"),
  };

  const renderTable = (items: VehicleServiceRowWithEstimate[], title: string, colorClass: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h2 className={`text-lg font-semibold tracking-tight flex items-center gap-2 ${colorClass}`}>
          {title} <span className="text-sm font-normal opacity-70">({items.length})</span>
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-surface/50">
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
            <TableBody className="divide-y divide-border">
              {items.map((row) => (
                <TableRow key={row.vehicleId} className="hover:bg-surface/50">
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
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderTable(grouped.OVERDUE, "Overdue", "text-status-red")}
      {renderTable(grouped.DUE_SOON, "Due Soon", "text-status-yellow")}
      {renderTable(grouped.OK, "Upcoming / OK", "text-status-green")}
      {renderTable(grouped.NEEDS_DATA, "Needs Data", "text-muted")}
    </div>
  );
}
