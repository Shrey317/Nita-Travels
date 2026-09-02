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
import { TodaysPriorities, type PriorityItem } from "@/components/dashboard/todays-priorities";
import { DashboardInsights, generateInsights } from "@/components/dashboard/dashboard-insights";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { parseDateRange, getPreviousPeriod } from "@/lib/date-ranges";
import { differenceInCalendarDays, startOfWeek } from "date-fns";

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
  const hasPeriodFilter = searchParams.range && searchParams.range !== "all";

  const [vehicles, fleetTotals, prevVehicles, prevFleetTotals, activeVehicleCount] = await Promise.all([
    getVehiclesWithFinancials(currentRange.from, currentRange.to),
    getFleetTotals(currentRange.from, currentRange.to),
    getVehiclesWithFinancials(prevRange.from, prevRange.to),
    getFleetTotals(prevRange.from, prevRange.to),
    prisma.vehicle.count({ where: { active: true, deletedAt: null } }),
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

  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const [recentMileageEntries, mileageViolationsCount] = await Promise.all([
    prisma.mileageEntry.groupBy({
      by: ['vehicleId'],
      where: { date: { gte: startOfCurrentWeek } },
    }),
    prisma.mileageEntry.count({
      where: { date: { gte: startOfCurrentWeek }, overLimitByKm: { gt: 0 } }
    })
  ]);

  const vehiclesWithRecentMileage = new Set(recentMileageEntries.map(e => e.vehicleId));
  const missingMileageCount = vehicles.filter(v => !vehiclesWithRecentMileage.has(v.vehicle.id)).length;

  const stats: DashboardStats = {
    incomeCents: fleetTotals.incomeCents,
    expenseCents: fleetTotals.expenseCents,
    netProfitCents: fleetTotals.netProfitCents,
    repairsCents,
    
    incomeTrend: hasPeriodFilter ? calculateTrend(fleetTotals.incomeCents, prevFleetTotals.incomeCents) : undefined,
    expenseTrend: hasPeriodFilter ? calculateTrend(fleetTotals.expenseCents, prevFleetTotals.expenseCents, true) : undefined,
    netProfitTrend: hasPeriodFilter ? calculateTrend(fleetTotals.netProfitCents, prevFleetTotals.netProfitCents) : undefined,
    repairsTrend: hasPeriodFilter ? calculateTrend(repairsCents, prevRepairsCents, true) : undefined,

    activeCount: activeVehicleCount,
    serviceOverdueCount,
    serviceDueCount,
    insuranceExpiredCount,
    insuranceExpiringCount,
    missingMileageCount,
    mileageViolationsCount,
  };

  // Build Today's Priorities from real data
  const priorities: PriorityItem[] = [];
  
  for (const v of vehicles) {
    // Service overdue
    if (v.service?.status === "OVERDUE" && v.service.kmRemaining !== null) {
      priorities.push({
        vehicleId: v.vehicle.id,
        severity: "critical",
        title: `Service overdue by ${Math.abs(v.service.kmRemaining).toLocaleString("en-ZA")} km`,
        href: `/vehicles/${v.vehicle.id}`,
      });
    }
    
    // Insurance expired or expiring soon
    if (v.vehicle.insuranceEndDate) {
      const daysUntil = differenceInCalendarDays(v.vehicle.insuranceEndDate, today);
      if (daysUntil < 0) {
        priorities.push({
          vehicleId: v.vehicle.id,
          severity: "critical",
          title: `Insurance expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`,
          href: `/vehicles/${v.vehicle.id}`,
        });
      } else if (daysUntil <= 14) {
        priorities.push({
          vehicleId: v.vehicle.id,
          severity: "warning",
          title: `Insurance expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
          href: `/vehicles/${v.vehicle.id}`,
        });
      }
    }

    // Missing mileage this week
    if (!vehiclesWithRecentMileage.has(v.vehicle.id)) {
      priorities.push({
        vehicleId: v.vehicle.id,
        severity: "warning",
        title: "Mileage not logged this week",
        href: "/mileage",
      });
    }

    // Service due soon (lower priority than overdue)
    if (v.service?.status === "DUE_SOON" && v.service.kmRemaining !== null) {
      priorities.push({
        vehicleId: v.vehicle.id,
        severity: "warning",
        title: `Service due — ${v.service.kmRemaining.toLocaleString("en-ZA")} km remaining`,
        href: `/vehicles/${v.vehicle.id}`,
      });
    }
  }
  
  // Sort: critical first
  priorities.sort((a, b) => (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1));

  // Generate insights from real data
  const insights = generateInsights({
    vehicles,
    fleetIncome: fleetTotals.incomeCents,
    fleetExpense: fleetTotals.expenseCents,
    fleetProfit: fleetTotals.netProfitCents,
    prevFleetIncome: hasPeriodFilter ? prevFleetTotals.incomeCents : undefined,
    prevFleetExpense: hasPeriodFilter ? prevFleetTotals.expenseCents : undefined,
    prevFleetProfit: hasPeriodFilter ? prevFleetTotals.netProfitCents : undefined,
    serviceOverdue: serviceOverdueCount,
    missingMileage: missingMileageCount,
  });

  const serviceRows = vehicles
    .map((v) => v.service)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => SERVICE_STATUS_SORT_ORDER[a.status] - SERVICE_STATUS_SORT_ORDER[b.status]);

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Fleet command center — real-time overview">
        <TimeFilter />
      </PageHeader>

      <TodaysPriorities items={priorities} />

      <ExtendedKpiCards stats={stats} />

      <InsuranceAlerts vehicles={vehicles.map((v) => v.vehicle)} />

      <DashboardInsights insights={insights} />

      <section className="space-y-3">
        <SectionHeading title="Per-Vehicle Financial Summary" />
        <VehicleSummaryTable vehicles={vehicles} fleetTotals={fleetTotals} />
      </section>

      <section className="space-y-3">
        <SectionHeading title="Service Status Overview" />
        <ServiceOverviewTable rows={serviceRows} />
      </section>
    </div>
  );
}
