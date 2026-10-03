export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, StickyNote, Gauge } from "lucide-react";
import { getVehicleDetail } from "@/lib/db/vehicles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoCard } from "@/components/vehicles/info-card";
import { ActivityTimeline } from "@/components/vehicles/activity-timeline";
import { DeactivateVehicleButton } from "@/components/vehicles/deactivate-vehicle-button";
import { formatZAR, formatKm, formatDate, formatMargin } from "@/lib/format";
import { getVehicleTimeline, getVehicleMonthlyFinancials } from "@/lib/db/vehicles";
import { badgeLabel, badgeVariant } from "@/lib/service";
import { calculateVehicleHealthScore, checkVehicleReplacementCriteria } from "@/lib/health";
import { FinancialChart } from "@/components/vehicles/financial-chart";
import { prisma } from "@/lib/db/client";
import { differenceInCalendarDays } from "date-fns";
import { VehicleHealthCard } from "@/components/vehicles/health-card";
import { VehicleReplacementCard } from "@/components/vehicles/replacement-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { financialMetrics } from "@/lib/finance";
import { businessToday, isoWeekStart, parseCalendarDate } from "@/lib/date-ranges";
import { getAnalyticsReport } from "@/lib/db/analytics";

interface VehicleProfilePageProps {
  params: { id: string };
  searchParams: { page?: string; dateFrom?: string; dateTo?: string; type?: string };
}

export default async function VehicleProfilePage({ params, searchParams }: VehicleProfilePageProps) {
  const detail = await getVehicleDetail(params.id);
  if (!detail) notFound();

  const { vehicle, incomeCents, expenseCents, repairsCents, netProfitCents, emiBalanceCents, roiPercent, kmSincePurchase, service, recentRepairs, highRepairCost } =
    detail;

  const startOfCurrentWeek = isoWeekStart(businessToday());
  const recentMileage = await prisma.mileageEntry.findFirst({
    where: { vehicleId: vehicle.id, date: { gte: startOfCurrentWeek, lte: businessToday() } },
  });
  const hasRecentMileage = !!recentMileage;

  const health = calculateVehicleHealthScore({
    active: vehicle.active,
    serviceStatus: service?.status,
    insuranceEndDate: vehicle.insuranceEndDate,
    hasRecentMileage,
    highRepairFrequency: recentRepairs.length > 2,
    highRepairCost,
    roiPercent: roiPercent,
  });

  const lifetime = financialMetrics(incomeCents, expenseCents, kmSincePurchase);
  const displayPerKm = (value: number | null) => value === null ? "—" : formatZAR(value);
  const { recommended: replaceRecommended, reasons: replaceReasons } = checkVehicleReplacementCriteria({
    currentMileageKm: vehicle.currentMileageKm,
    purchaseDate: vehicle.purchaseDate,
    roiPercent: roiPercent,
    repairsCostCents: repairsCents,
    totalIncomeCents: incomeCents,
    profitPerKmCents: lifetime.profitPerKmCents,
  });

  const [timeline, monthlyFinancials, operations] = await Promise.all([
    getVehicleTimeline(vehicle.id, {
      page: Number(searchParams.page ?? "1") || 1,
      dateFrom: searchParams.dateFrom ? parseCalendarDate(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? parseCalendarDate(searchParams.dateTo) : undefined,
      type: searchParams.type === "transactions" || searchParams.type === "notes" ? searchParams.type : "all",
    }),
    getVehicleMonthlyFinancials(vehicle.id),
    getAnalyticsReport({ range: "12-months", vehicleId: vehicle.id }),
  ]);

  const registrationLine = vehicle.registration2 ? `${vehicle.registration} / ${vehicle.registration2}` : vehicle.registration;

  // Compute insurance display
  const insuranceDaysRemaining = vehicle.insuranceEndDate
    ? differenceInCalendarDays(vehicle.insuranceEndDate, businessToday())
    : null;
  const insuranceExpired = insuranceDaysRemaining !== null && insuranceDaysRemaining < 0;
  const insuranceDisplay = insuranceDaysRemaining === null
    ? "—"
    : insuranceExpired
      ? "Expired"
      : `${insuranceDaysRemaining} day${insuranceDaysRemaining !== 1 ? "s" : ""}`;
  const insuranceColor = insuranceDaysRemaining === null
    ? "text-ink"
    : insuranceExpired
      ? "text-status-error"
      : insuranceDaysRemaining <= 30
        ? "text-status-warning"
        : "text-status-success";

  return (
    <div className="space-y-8">
      {/* ── Vehicle Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center rounded-md bg-navy px-2.5 py-1 text-sm font-semibold text-white">
              {vehicle.id}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {vehicle.make} {vehicle.model}
            </h1>
            {!vehicle.active && <Badge variant="destructive">Inactive</Badge>}
            {service && <Badge variant={badgeVariant[service.status]}>{badgeLabel[service.status]}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">{registrationLine}</p>
          <p className="mt-1 text-xs text-muted">Vehicle command center · lifetime financial totals</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/vehicles/${vehicle.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/transactions/new?vehicleId=${vehicle.id}`}>
              <Plus className="h-3.5 w-3.5" />
              Transaction
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/mileage/new?vehicleId=${vehicle.id}`}>
              <Gauge className="h-3.5 w-3.5" />
              Mileage
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/vehicles/${vehicle.id}/notes/new`}>
              <StickyNote className="h-3.5 w-3.5" />
              Note
            </Link>
          </Button>
          {vehicle.active && <DeactivateVehicleButton vehicleId={vehicle.id} />}
        </div>
      </div>

      <nav aria-label="Vehicle sections" className="flex flex-wrap gap-2 border-b border-border pb-4 text-sm">
        <Link className="rounded-input px-3 py-2 text-brand-blue hover:bg-surface-secondary" href="#vehicle-financials">Financial</Link>
        <Link className="rounded-input px-3 py-2 text-brand-blue hover:bg-surface-secondary" href="#vehicle-maintenance">Maintenance</Link>
        <Link className="rounded-input px-3 py-2 text-brand-blue hover:bg-surface-secondary" href="#vehicle-operations">Operations</Link>
        <Link className="rounded-input px-3 py-2 text-brand-blue hover:bg-surface-secondary" href="#vehicle-activity">Activity</Link>
        <Link className="rounded-input px-3 py-2 text-brand-blue hover:bg-surface-secondary" href={`/analytics?vehicleId=${vehicle.id}`}>Period analytics</Link>
        <Link className="rounded-input px-3 py-2 text-brand-blue hover:bg-surface-secondary" href={`/mileage?vehicleId=${vehicle.id}`}>Mileage history</Link>
      </nav>

      {/* ── Scannable Status Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Status</p>
          <p className={`mt-1 font-semibold ${vehicle.active ? "text-status-success" : "text-status-error"}`}>
            {vehicle.active ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Mileage</p>
          <p className="mt-1 font-semibold text-ink font-mono-figures">{formatKm(vehicle.currentMileageKm)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Health</p>
          <p className={`mt-1 font-semibold ${health.score >= 80 ? 'text-status-success' : health.score >= 50 ? 'text-status-warning' : 'text-status-error'}`}>
            {health.score} / 100
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Insurance</p>
          <p className={`mt-1 font-semibold ${insuranceColor}`}>{insuranceDisplay}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Lifetime revenue</p>
          <p className="mt-1 font-semibold text-brand-blue font-mono-figures">{formatZAR(incomeCents)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Lifetime profit</p>
          <p className={`mt-1 font-semibold font-mono-figures ${netProfitCents >= 0 ? "text-status-success" : "text-status-error"}`}>
            {formatZAR(netProfitCents)}
          </p>
        </div>
      </div>

      <div id="vehicle-maintenance" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-4">
        <VehicleHealthCard score={health.score} reasons={health.reasons} categories={health.categories} />
        <VehicleReplacementCard recommended={replaceRecommended} reasons={replaceReasons} />
      </div>

      <section id="vehicle-operations" className="scroll-mt-24 space-y-3">
        <SectionHeading title="Operations & Maintenance" />
        <p className="text-sm text-muted">Last 12 calendar months · {operations.selection.label}. Figures use recorded activity; missing mileage is not estimated.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Mileage & Utilization" fields={[
            { label: "Recorded distance", value: formatKm(operations.current.totals.mileageKm) },
            { label: "Average recorded KM / week", value: formatKm(Math.round(operations.current.mileage.averageKmPerWeek)) },
            { label: "Highest complete week", value: formatKm(operations.current.mileage.highestWeeklyKm) },
            { label: "Complete weeks over limit", value: String(operations.current.mileage.violations.length) },
            { label: "Over-limit distance", value: formatKm(operations.current.mileage.overLimitKm) },
            { label: "This week's reading", value: hasRecentMileage ? "Recorded" : "Not recorded" },
          ]} />
          <InfoCard title="Maintenance Evidence" fields={[
            { label: "Repair records", value: String(operations.current.maintenance.repairCount) },
            { label: "Service records", value: String(operations.current.maintenance.serviceCount) },
            { label: "Repair expenditure", value: formatZAR(operations.current.totals.repairsCents) },
            { label: "Service expenditure", value: formatZAR(operations.current.totals.serviceCents) },
            { label: "Maintenance expenditure", value: formatZAR(operations.current.totals.maintenanceCents) },
            { label: "Maintenance / KM", value: displayPerKm(operations.current.totals.maintenancePerKmCents) },
            { label: "Average repair amount", value: operations.current.maintenance.averageRepairCents === null ? "—" : formatZAR(operations.current.maintenance.averageRepairCents) },
          ]} />
        </div>
        {operations.current.repairPatterns.length > 0 && <div className="rounded-card border border-status-warning/30 bg-card p-4"><h3 className="font-medium">Repeat repair patterns detected</h3><ul className="mt-2 space-y-2 text-sm text-muted">{operations.current.repairPatterns.map(pattern => <li key={pattern.category}><Link href={`/repairs?vehicleId=${vehicle.id}&dateFrom=${operations.selection.range.from.toISOString().slice(0, 10)}&dateTo=${operations.selection.range.to.toISOString().slice(0, 10)}`} className="text-brand-blue hover:underline">{pattern.category}: {pattern.occurrences} records · {formatZAR(pattern.totalCostCents)}</Link><span className="block">Previous {pattern.previousDate}; latest {pattern.latestDate}; {pattern.daysBetween} days apart. Repeated categories are evidence for review, not a confirmed fault.</span></li>)}</ul></div>}
        <p className="text-xs text-muted">Downtime requires repair start and completion dates, which are not recorded. Warranty remains the supplied coverage text; dates and mileage limits are not inferred from it.</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoCard
          title="Identity & Specs"
          fields={[
            { label: "Vehicle ID", value: vehicle.id },
            { label: "Make", value: vehicle.make },
            { label: "Model", value: vehicle.model },
            { label: "Registration", value: vehicle.registration },
            { label: "Reg. 2", value: vehicle.registration2 ?? "—" },
            { label: "Transmission", value: vehicle.transmission },
            { label: "Warranty", value: vehicle.warranty ?? "—" },
            { label: "Service Interval", value: formatKm(vehicle.serviceIntervalKm) },
          ]}
        />
        <InfoCard
          title="Purchase & Mileage"
          fields={[
            { label: "Purchase Date", value: formatDate(vehicle.purchaseDate) },
            { label: "Purchase Price", value: formatZAR(vehicle.purchasePriceCents) },
            { label: "Mileage at Purchase", value: formatKm(vehicle.mileageAtPurchaseKm) },
            { label: "Current Mileage", value: formatKm(vehicle.currentMileageKm) },
            { label: "KM Since Purchase", value: formatKm(kmSincePurchase) },
          ]}
        />
        <InfoCard
          title="EMI / Financing"
          fields={[
            { label: "Monthly EMI", value: formatZAR(vehicle.targetEmiCents) },
            { label: "Term", value: `${vehicle.emiMonthsTotal} months` },
            { label: "Months Paid", value: String(vehicle.emiMonthsPaid) },
            { label: "EMI Balance", value: formatZAR(emiBalanceCents) },
          ]}
        />
        <InfoCard
          title="Insurance"
          fields={[
            { label: "Insurer", value: vehicle.insurer ?? "—" },
            { label: "Policy Number", value: vehicle.policyNumber ?? "—" },
            { label: "Monthly Premium", value: formatZAR(vehicle.monthlyPremiumCents) },
            { label: "Insurance End Date", value: vehicle.insuranceEndDate ? formatDate(vehicle.insuranceEndDate) : "—" },
          ]}
        />
        <InfoCard
          title="Lifetime Financial Performance"
          fields={[
            { label: "Total Income", value: formatZAR(incomeCents) },
            { label: "Total Expenses", value: formatZAR(expenseCents) },
            { label: "Repairs Cost", value: formatZAR(repairsCents) },
            { label: "Net P/L", value: formatZAR(netProfitCents) },
            { label: "Margin", value: formatMargin(incomeCents, expenseCents) },
            { label: "ROI on Purchase", value: roiPercent === null ? "—" : `${roiPercent.toFixed(1)}%` },
            { label: "Revenue / KM", value: displayPerKm(lifetime.revenuePerKmCents) },
            { label: "Cost / KM", value: displayPerKm(lifetime.costPerKmCents) },
            { label: "Profit / KM", value: displayPerKm(lifetime.profitPerKmCents) },
          ]}
        />
        <InfoCard
          title="Service Status"
          fields={[
            { label: "Last Service Date", value: service?.lastServiceDate ? formatDate(service.lastServiceDate) : "—" },
            { label: "Mileage at Last Svc", value: formatKm(service?.lastServiceMileageKm ?? null) },
            { label: "Next Svc KM", value: formatKm(service?.nextSvcKm ?? null) },
            { label: "Current KM", value: formatKm(vehicle.currentMileageKm) },
            { label: "KM Remaining", value: formatKm(service?.kmRemaining ?? null) },
            {
              label: "Status",
              value: service ? (
                <Badge variant={badgeVariant[service.status]}>{badgeLabel[service.status]}</Badge>
              ) : (
                <Badge variant="warning">Needs Data</Badge>
              ),
            },
          ]}
        />
      </div>

      <section id="vehicle-financials" className="scroll-mt-24 space-y-3">
        <SectionHeading title="Monthly Financials" />
        <p className="text-sm text-muted">Lifetime per-kilometre figures use the odometer difference since purchase. Use period analytics to compare recorded mileage and financial activity over matching dates.</p>
        <FinancialChart data={monthlyFinancials} />
      </section>

      <section id="vehicle-activity" className="scroll-mt-24 space-y-3">
        <SectionHeading title="Activity Timeline" />
        <ActivityTimeline timeline={timeline} />
      </section>
    </div>
  );
}
