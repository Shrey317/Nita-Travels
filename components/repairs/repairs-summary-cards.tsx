import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatZAR, formatDate, formatVehicleLabel } from "@/lib/format";
import type { RepairsSummary } from "@/lib/db/transactions";

export function RepairsSummaryCards({ summary }: { summary: RepairsSummary }) {
  const mostRecentLabel = summary.mostRecent
    ? `${formatDate(summary.mostRecent.date)} — ${formatVehicleLabel(summary.mostRecent.vehicleId)}`
    : "—";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Total Repair Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold text-status-red">{formatZAR(summary.totalCostCents)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Total Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold text-ink">{summary.totalEvents}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Most Recent Repair</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-lg font-semibold text-ink">{mostRecentLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
