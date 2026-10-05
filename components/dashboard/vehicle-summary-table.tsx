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
  vehicles: Pick<VehicleSummary, "vehicle" | "incomeCents" | "expenseCents" | "repairsCents" | "netProfitCents" | "marginLabel" | "service">[];
  fleetTotals: FleetTotals;
  totalLabel?: string;
}

/** Sorted Net P/L descending; the grand total row uses fleet-wide totals (including ALLCR and
 *  no-vehicle entries), not just the sum of the rows shown — SRS 15.1. */
export function VehicleSummaryTable({ vehicles, fleetTotals, totalLabel = "Grand Total (fleet-wide)" }: VehicleSummaryTableProps) {
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
    <>
    <div className="space-y-3 md:hidden">
      {sorted.map(({ vehicle, incomeCents, expenseCents, netProfitCents, service }) => (
        <article key={vehicle.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/vehicles/${vehicle.id}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-blue"><Truck className="h-4 w-4" aria-hidden="true" />{vehicle.id}</Link><Badge variant={service ? badgeVariant[service.status] : "warning"}>{service ? badgeLabel[service.status] : "Needs Data"}</Badge></div>
          <p className="text-sm text-muted">{vehicle.registration}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Income</dt><dd className="mt-1 font-medium tabular-nums">{formatZAR(incomeCents)}</dd></div><div><dt className="text-muted">Expenses</dt><dd className="mt-1 font-medium tabular-nums">{formatZAR(expenseCents)}</dd></div><div className="col-span-2 flex flex-wrap justify-between gap-2 border-t border-border pt-3"><dt>Net profit</dt><dd className={`font-semibold tabular-nums ${netProfitCents < 0 ? "text-status-error" : "text-ink"}`}>{formatZAR(netProfitCents)}</dd></div></dl>
        </article>
      ))}
      <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-surface-secondary p-4 text-sm font-semibold"><span>{totalLabel}</span><span>{formatZAR(fleetTotals.netProfitCents)}</span></div>
    </div>
    <div className="hidden md:block">
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
              <Link href={`/vehicles/${vehicle.id}`} className="font-medium text-brand-blue hover:underline">
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
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/transactions/new?vehicleId=${vehicle.id}`}
                  className="rounded p-1.5 text-muted hover:bg-surface-secondary hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
                  title="Add Transaction"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">Add Transaction</span>
                </Link>
                <Link
                  href={`/mileage/new?vehicleId=${vehicle.id}`}
                  className="rounded p-1.5 text-muted hover:bg-surface-secondary hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
                  title="Add Mileage"
                >
                  <Gauge className="h-4 w-4" />
                  <span className="sr-only">Add Mileage</span>
                </Link>
                <Link
                  href={`/vehicles/${vehicle.id}/notes/new`}
                  className="rounded p-1.5 text-muted hover:bg-surface-secondary hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
                  title="Add Note"
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Add Note</span>
                </Link>
                <Link
                  href={`/vehicles/${vehicle.id}/edit`}
                  className="rounded p-1.5 text-muted hover:bg-surface-secondary hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
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
          <TableCell colSpan={2}>{totalLabel}</TableCell>
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
    </div>
    </>
  );
}
