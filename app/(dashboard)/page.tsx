export const dynamic = "force-dynamic";

import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { getFleetTotals } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { SERVICE_STATUS_SORT_ORDER } from "@/lib/service";
import { ExtendedKpiCards, DashboardStats, TrendData } from "@/components/dashboard/extended-kpi-cards";
import { InsuranceAlerts } from "@/components/dashboard/insurance-alerts";
import { VehicleSummaryTable } from "@/components/dashboard/vehicle-summary-table";
import { ServiceOverviewTable } from "@/components/dashboard/service-overview-table";
import { TimeFilter } from "@/components/dashboard/time-filter";
import { parseDateRange, getPreviousPeriod } from "@/lib/date-ranges";

function calculateTrend(current: number, previous: number, invertGoodBad = false): TrendData | undefined {
  if (current === 0 && previous === 0) return undefined;
  
  let percent = 0;
  if (previous === 0) {
    percent = current > 0 ? 100 : -100;
  } else {
    percent = ((current - previous) / Math.abs(previous)) * 100;
  }
  
  const isPositive = invertGoodBad ? percent <= 0 : percent >= 0;
  
  return {
    percent: Math.abs(percent),
    isPositive,
    label: "vs prev period",
  };
}

export default async function DashboardPage({ searchParams }: { searchParams: { range?: string } }) {
  const currentRange = parseDateRange(searchParams.range);
  const prevRange = getPreviousPeriod(currentRange);

  const [vehicles, fleetTotals, prevVehicles, prevFleetTotals, activeVehicleCount] = await Promise.all([
    getVehiclesWithFinancials(currentRange.from, currentRange.to),
    getFleetTotals(currentRange.from, currentRange.to),
    getVehiclesWithFinancials(prevRange.from, prevRange.to),
    getFleetTotals(prevRange.from, prevRange.to),
    prisma.vehicle.count({ where: { active: true } }),
  ]);

  const today = new Date();
  
  let repairsCents = 0;
  let serviceOverdueCount = 0;
  let serviceDueCount = 0;
  let insuranceExpiredCount = 0;
  let insuranceExpiringCount = 0;
  
  for (const v of vehicles) {
    repairsCents += v.repairsCents;
    if (v.service?.status === "OVERDUE") serviceOverdueCount++;
    if (v.service?.status === "DUE_SOON") serviceDueCount++;
    
    if (v.vehicle.insuranceEndDate) {
      const end = new Date(v.vehicle.insuranceEndDate).getTime();
      if (end < today.getTime()) {
        insuranceExpiredCount++;
      } else if (end - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
        insuranceExpiringCount++;
      }
    }
  }

  let prevRepairsCents = 0;
  for (const v of prevVehicles) {
    prevRepairsCents += v.repairsCents;
  }

  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [recentMileageEntries, mileageViolationsCount] = await Promise.all([
    prisma.mileageEntry.groupBy({
      by: ['vehicleId'],
      where: { date: { gte: weekAgo } },
    }),
    prisma.mileageEntry.count({
      where: { date: { gte: weekAgo }, overLimitByKm: { gt: 0 } }
    })
  ]);

  const vehiclesWithRecentMileage = new Set(recentMileageEntries.map(e => e.vehicleId));
  const missingMileageCount = vehicles.filter(v => !vehiclesWithRecentMileage.has(v.vehicle.id)).length;

  const stats: DashboardStats = {
    incomeCents: fleetTotals.incomeCents,
    expenseCents: fleetTotals.expenseCents,
    netProfitCents: fleetTotals.netProfitCents,
    repairsCents,
    
    incomeTrend: searchParams.range && searchParams.range !== "all" ? calculateTrend(fleetTotals.incomeCents, prevFleetTotals.incomeCents) : undefined,
    expenseTrend: searchParams.range && searchParams.range !== "all" ? calculateTrend(fleetTotals.expenseCents, prevFleetTotals.expenseCents, true) : undefined,
    netProfitTrend: searchParams.range && searchParams.range !== "all" ? calculateTrend(fleetTotals.netProfitCents, prevFleetTotals.netProfitCents) : undefined,
    repairsTrend: searchParams.range && searchParams.range !== "all" ? calculateTrend(repairsCents, prevRepairsCents, true) : undefined,

    activeCount: activeVehicleCount,
    serviceOverdueCount,
    serviceDueCount,
    insuranceExpiredCount,
    insuranceExpiringCount,
    missingMileageCount,
    mileageViolationsCount,
  };

  const serviceRows = vehicles
    .map((v) => v.service)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => SERVICE_STATUS_SORT_ORDER[a.status] - SERVICE_STATUS_SORT_ORDER[b.status]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="text-sm text-muted">Fleet overview as of today</p>
        </div>
        <TimeFilter />
      </div>

      <ExtendedKpiCards stats={stats} />

      <InsuranceAlerts vehicles={vehicles.map((v) => v.vehicle)} />

      <section className="animate-slide-up delay-300">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="inline-block h-5 w-1 rounded-full bg-gradient-to-b from-teal to-teal-light" />
          Per-Vehicle Financial Summary
        </h2>
        <VehicleSummaryTable vehicles={vehicles} fleetTotals={fleetTotals} />
      </section>

      <section className="animate-slide-up delay-400">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="inline-block h-5 w-1 rounded-full bg-gradient-to-b from-teal to-teal-light" />
          Service Status Overview
        </h2>
        <ServiceOverviewTable rows={serviceRows} />
      </section>
    </div>
  );
}
