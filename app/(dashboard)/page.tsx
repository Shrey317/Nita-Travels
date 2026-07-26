export const dynamic = "force-dynamic"; // live operational data — never statically cached

import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { getFleetTotals } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { SERVICE_STATUS_SORT_ORDER } from "@/lib/service";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { InsuranceAlerts } from "@/components/dashboard/insurance-alerts";
import { VehicleSummaryTable } from "@/components/dashboard/vehicle-summary-table";
import { ServiceOverviewTable } from "@/components/dashboard/service-overview-table";

export default async function DashboardPage() {
  const [vehicles, fleetTotals, activeVehicleCount] = await Promise.all([
    getVehiclesWithFinancials(),
    getFleetTotals(),
    prisma.vehicle.count({ where: { active: true } }),
  ]);

  // Reuses the service status already attached to each vehicle summary rather than
  // re-querying it, then re-sorts a copy by status priority for this section specifically
  // (the financial table above sorts the same data by Net P/L instead).
  const serviceRows = vehicles
    .map((v) => v.service)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => SERVICE_STATUS_SORT_ORDER[a.status] - SERVICE_STATUS_SORT_ORDER[b.status]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Fleet overview as of today</p>
      </div>

      <KpiCards
        incomeCents={fleetTotals.incomeCents}
        expenseCents={fleetTotals.expenseCents}
        netProfitCents={fleetTotals.netProfitCents}
        fleetSize={activeVehicleCount}
      />

      <InsuranceAlerts vehicles={vehicles.map((v) => v.vehicle)} />

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-ink">Per-Vehicle Financial Summary</h2>
        <VehicleSummaryTable vehicles={vehicles} fleetTotals={fleetTotals} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-ink">Service Status Overview</h2>
        <ServiceOverviewTable rows={serviceRows} />
      </section>
    </div>
  );
}
