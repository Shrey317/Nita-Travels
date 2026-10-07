import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatKm } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import { EmptyState } from "@/components/shared/empty-state";
import { Wrench, AlertCircle, Clock, CheckCircle, HelpCircle } from "lucide-react";
import type { VehicleServiceRowWithEstimate } from "@/lib/db/service";

/** Read-only, fully computed (SRS 15.6). Rows are already sorted OVERDUE -> DUE_SOON -> OK ->
 *  NEEDS_DATA by lib/db/service.ts. */
export function ServiceTable({ rows }: { rows: VehicleServiceRowWithEstimate[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No vehicles found"
        description="No vehicles match the current filter, or you haven't added any vehicles yet."
        icon={Wrench}
      />
    );
  }

  const grouped = {
    OVERDUE: rows.filter((r) => r.status === "OVERDUE"),
    DUE_SOON: rows.filter((r) => r.status === "DUE_SOON"),
    OK: rows.filter((r) => r.status === "OK"),
    NEEDS_DATA: rows.filter((r) => r.status === "NEEDS_DATA"),
  };

  const statusIcons = {
    OVERDUE: <AlertCircle className="h-4 w-4" />,
    DUE_SOON: <Clock className="h-4 w-4" />,
    OK: <CheckCircle className="h-4 w-4" />,
    NEEDS_DATA: <HelpCircle className="h-4 w-4" />,
  };

  const statusColors = {
    OVERDUE: "text-error",
    DUE_SOON: "text-warning",
    OK: "text-status-success",
    NEEDS_DATA: "text-muted",
  };

  const renderTable = (items: VehicleServiceRowWithEstimate[], title: string, status: keyof typeof statusColors) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h2 className={`text-lg font-bold tracking-tight flex items-center gap-2 ${statusColors[status]}`}>
          {statusIcons[status]}
          {title} <span className="text-sm font-normal opacity-70">({items.length})</span>
        </h2>
        <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-surface-elevated/50">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Vehicle ID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Registration</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Last Service Date</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Mileage at Last Svc</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Next Svc KM</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Current KM</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">KM Remaining</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Days to Next (est.)</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border-subtle">
              {items.map((row) => (
                <TableRow key={row.vehicleId} className="hover:bg-surface-elevated/50 transition-colors">
                  <TableCell>
                    <Link href={`/vehicles/${row.vehicleId}`} className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors">
                      {row.vehicleId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-secondary">{row.registration}</TableCell>
                  <TableCell className="text-ink-secondary">{row.lastServiceDate ? formatDate(row.lastServiceDate) : "—"}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatKm(row.lastServiceMileageKm)}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-white">{formatKm(row.nextSvcKm)}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-white">{formatKm(row.currentMileageKm)}</TableCell>
                  <TableCell className={`text-right font-mono-figures text-sm font-semibold ${statusColors[status]}`}>{formatKm(row.kmRemaining)}</TableCell>
                  <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{row.daysToNext === null ? "—" : row.daysToNext}</TableCell>
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
      {renderTable(grouped.OVERDUE, "Overdue", "OVERDUE")}
      {renderTable(grouped.DUE_SOON, "Due Soon", "DUE_SOON")}
      {renderTable(grouped.OK, "Upcoming / OK", "OK")}
      {renderTable(grouped.NEEDS_DATA, "Needs Data", "NEEDS_DATA")}
    </div>
  );
}
