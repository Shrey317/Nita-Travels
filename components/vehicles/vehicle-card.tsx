import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatZAR, formatKm } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import type { VehicleSummary } from "@/lib/db/vehicles";

export function VehicleCard({ vehicle, incomeCents, expenseCents, netProfitCents, service }: VehicleSummary) {
  const registrationLine = vehicle.registration2 ? `${vehicle.registration} / ${vehicle.registration2}` : vehicle.registration;
  return <Card className="h-full transition-colors hover:border-brand-blue/40">
    <CardContent className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><span className="inline-flex rounded-badge bg-navy px-2 py-1 text-xs font-semibold text-white">{vehicle.id}</span><h2 className="mt-2 font-semibold text-ink">{vehicle.make} {vehicle.model}</h2><p className="break-words text-sm text-muted">{registrationLine}</p></div>
        {!vehicle.active ? <Badge variant="secondary">Inactive</Badge> : service ? <Badge variant={badgeVariant[service.status]}>{badgeLabel[service.status]}</Badge> : <Badge variant="warning">Needs Data</Badge>}
      </div>
      <div className="flex justify-between gap-3 text-xs text-muted"><span>Lifetime financials</span><span>{formatKm(vehicle.currentMileageKm)}</span></div>
      <dl className="space-y-2 border-y border-border py-3 text-sm">
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-muted">Revenue</dt><dd className="tabular-nums text-ink">{formatZAR(incomeCents)}</dd></div>
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-muted">Expenses</dt><dd className="tabular-nums text-ink">{formatZAR(expenseCents)}</dd></div>
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="font-medium">Net profit</dt><dd className={`tabular-nums font-semibold ${netProfitCents > 0 ? "text-status-success" : netProfitCents < 0 ? "text-status-error" : "text-ink"}`}>{formatZAR(netProfitCents)}</dd></div>
      </dl>
      <Button asChild variant="outline" className="w-full"><Link href={`/vehicles/${vehicle.id}`}>View Profile<span className="sr-only"> for {vehicle.id}</span></Link></Button>
    </CardContent>
  </Card>;
}
