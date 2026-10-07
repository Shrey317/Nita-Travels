import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatZAR, formatDate, formatVehicleLabel } from "@/lib/format";
import { Wrench, Hash, Calendar } from "lucide-react";
import type { RepairsSummary } from "@/lib/db/transactions";

export function RepairsSummaryCards({ summary }: { summary: RepairsSummary }) {
  const mostRecentLabel = summary.mostRecent
    ? `${formatDate(summary.mostRecent.date)} — ${formatVehicleLabel(summary.mostRecent.vehicleId)}`
    : "—";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="bg-card border-border-subtle shadow-card-elevated">
        <CardHeader className="pb-2 flex flex-row items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 border border-error/20">
            <Wrench className="h-4 w-4 text-error" />
          </div>
          <CardTitle className="text-sm font-medium text-ink-secondary">Total Repair Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono-figures text-2xl font-bold text-error">{formatZAR(summary.totalCostCents)}</p>
        </CardContent>
      </Card>
      <Card className="bg-card border-border-subtle shadow-card-elevated">
        <CardHeader className="pb-2 flex flex-row items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Hash className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium text-ink-secondary">Total Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono-figures text-2xl font-bold text-white">{summary.totalEvents}</p>
        </CardContent>
      </Card>
      <Card className="bg-card border-border-subtle shadow-card-elevated">
        <CardHeader className="pb-2 flex flex-row items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 border border-info/20">
            <Calendar className="h-4 w-4 text-info" />
          </div>
          <CardTitle className="text-sm font-medium text-ink-secondary">Most Recent Repair</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono-figures text-lg font-bold text-white">{mostRecentLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
