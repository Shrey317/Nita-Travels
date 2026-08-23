import Link from "next/link";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatZAR, formatMargin } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import { EmptyState } from "@/components/shared/empty-state";
import { Pencil, PlusCircle, Gauge, FileText, Truck } from "lucide-react";
import type { VehicleSummary } from "@/lib/db/vehicles";
import type { FleetTotals } from "@/lib/db/transactions";

interface VehicleSummaryTableProps {
  vehicles: VehicleSummary[];
  fleetTotals: FleetTotals;
}

/** Sorted Net P/L descending; the grand total row uses fleet-wide totals (including ALLCR and
 *  no-vehicle entries), not just the sum of the rows shown — SRS 15.1. */
export function VehicleSummaryTable({ vehicles, fleetTotals }: VehicleSummaryTableProps) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="No vehicles yet"
        description="Add your first vehicle to start tracking expenses, income, and service records."
        actionLabel="Add Vehicle"
        actionHref="/vehicles/new"
        icon={Truck}
      />
    );
  }

  const sorted = [...vehicles].sort((a, b) => b.netProfitCents - a.netProfitCents);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Vehicle ID</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead className="text-right">Income (R)</TableHead>
          <TableHead className="text-right">Expense (R)</TableHead>
          <TableHead className="text-right">Repairs (R)</TableHead>
          <TableHead className="text-right">Net P/L (R)</TableHead>
          <TableHead className="text-right">Margin %</TableHead>
          <TableHead>Service Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map(({ vehicle, incomeCents, expenseCents, repairsCents, netProfitCents, marginLabel, service }) => (
          <TableRow key={vehicle.id}>
            <TableCell>
              <Link href={`/vehicles/${vehicle.id}`} className="font-medium text-teal hover:underline">
                {vehicle.id}
              </Link>
            </TableCell>
            <TableCell>{vehicle.registration}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(incomeCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(expenseCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(repairsCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm font-medium">{formatZAR(netProfitCents)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{marginLabel}</TableCell>
            <TableCell>
              {service ? (
                <Badge variant={badgeVariant[service.status]}>{badgeLabel[service.status]}</Badge>
              ) : (
                <Badge variant="warning">Needs Data</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2 opacity-50 transition-opacity hover:opacity-100 focus-within:opacity-100">
                <Link
                  href={`/transactions/new?vehicleId=${vehicle.id}`}
                  className="rounded p-1.5 text-muted hover:bg-surface hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                  title="Add Transaction"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">Add Transaction</span>
                </Link>
                <Link
                  href={`/mileage/new?vehicleId=${vehicle.id}`}
                  className="rounded p-1.5 text-muted hover:bg-surface hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                  title="Add Mileage"
                >
                  <Gauge className="h-4 w-4" />
                  <span className="sr-only">Add Mileage</span>
                </Link>
                <Link
                  href={`/vehicles/${vehicle.id}/notes/new`}
                  className="rounded p-1.5 text-muted hover:bg-surface hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                  title="Add Note"
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Add Note</span>
                </Link>
                <Link
                  href={`/vehicles/${vehicle.id}/edit`}
                  className="rounded p-1.5 text-muted hover:bg-surface hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                  title="Edit Vehicle"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Vehicle</span>
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={2}>Grand Total (fleet-wide)</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(fleetTotals.incomeCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">{formatZAR(fleetTotals.expenseCents)}</TableCell>
          <TableCell />
          <TableCell className="text-right font-mono text-sm">{formatZAR(fleetTotals.netProfitCents)}</TableCell>
          <TableCell className="text-right font-mono text-sm">
            {formatMargin(fleetTotals.incomeCents, fleetTotals.expenseCents)}
          </TableCell>
          <TableCell />
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
