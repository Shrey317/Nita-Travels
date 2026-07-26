import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatZAR } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import type { VehicleSummary } from "@/lib/db/vehicles";

/** Card content per SRS 15.2: ID badge, make/model, registration (+reg2 if present), service
 *  status, income/expense/net chips, and a link into the profile. */
export function VehicleCard({ vehicle, incomeCents, expenseCents, netProfitCents, service }: VehicleSummary) {
  const isProfit = netProfitCents > 0;
  const registrationLine = vehicle.registration2
    ? `${vehicle.registration} / ${vehicle.registration2}`
    : vehicle.registration;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center rounded-md bg-navy px-2 py-1 text-xs font-semibold text-white">
              {vehicle.id}
            </span>
            <p className="mt-2 font-semibold text-ink">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm text-muted">{registrationLine}</p>
          </div>
          {service ? (
            <Badge variant={badgeVariant[service.status]}>{badgeLabel[service.status]}</Badge>
          ) : (
            <Badge variant="warning">Needs Data</Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface px-2 py-2">
            <p className="text-xs text-muted">Income</p>
            <p className="truncate font-mono text-sm font-medium text-status-green">{formatZAR(incomeCents)}</p>
          </div>
          <div className="rounded-lg bg-surface px-2 py-2">
            <p className="text-xs text-muted">Expense</p>
            <p className="truncate font-mono text-sm font-medium text-status-red">{formatZAR(expenseCents)}</p>
          </div>
          <div className="rounded-lg bg-surface px-2 py-2">
            <p className="text-xs text-muted">Net P/L</p>
            <p className={`truncate font-mono text-sm font-medium ${isProfit ? "text-status-green" : "text-status-red"}`}>
              {formatZAR(netProfitCents)}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/vehicles/${vehicle.id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
