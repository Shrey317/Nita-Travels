import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatZAR, formatKm } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import { Car, ChevronRight } from "lucide-react";
import type { VehicleSummary } from "@/lib/db/vehicles";

export function VehicleCard({ vehicle, incomeCents, expenseCents, netProfitCents, service }: VehicleSummary) {
  const registrationLine = vehicle.registration2 ? `${vehicle.registration} / ${vehicle.registration2}` : vehicle.registration;
  return (
    <Card className="group h-full bg-card border-border-subtle shadow-card-elevated hover:border-primary/30 hover:shadow-lg transition-all duration-200">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Car className="h-4 w-4" />
              </span>
              <span className="inline-flex rounded-md bg-surface-elevated px-2 py-1 text-xs font-bold text-white border border-border-subtle">{vehicle.id}</span>
            </div>
            <h2 className="font-bold text-white group-hover:text-primary transition-colors">{vehicle.make} {vehicle.model}</h2>
            <p className="break-words text-sm text-ink-secondary">{registrationLine}</p>
          </div>
          {!vehicle.active ? <Badge variant="secondary">Inactive</Badge> : service ? <Badge variant={badgeVariant[service.status]}>{badgeLabel[service.status]}</Badge> : <Badge variant="warning">Needs Data</Badge>}
        </div>
        <div className="flex justify-between gap-3 text-xs text-ink-secondary"><span>Lifetime financials</span><span className="font-mono-figures">{formatKm(vehicle.currentMileageKm)}</span></div>
        <dl className="space-y-2.5 border-y border-border-subtle py-3.5 text-sm">
          <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-ink-secondary">Revenue</dt><dd className="font-mono-figures text-white">{formatZAR(incomeCents)}</dd></div>
          <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-ink-secondary">Expenses</dt><dd className="font-mono-figures text-white">{formatZAR(expenseCents)}</dd></div>
          <div className="flex flex-wrap justify-between gap-x-3"><dt className="font-medium text-white">Net profit</dt><dd className={`font-mono-figures font-semibold ${netProfitCents > 0 ? "text-status-success" : netProfitCents < 0 ? "text-error" : "text-white"}`}>{formatZAR(netProfitCents)}</dd></div>
        </dl>
        <Button asChild variant="outline" className="w-full group-hover:border-primary/30 group-hover:text-primary transition-colors">
          <Link href={`/vehicles/${vehicle.id}`}>
            View Profile
            <ChevronRight className="h-4 w-4 ml-auto" />
            <span className="sr-only"> for {vehicle.id}</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
