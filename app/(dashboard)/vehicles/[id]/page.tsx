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
import { differenceInCalendarDays, startOfWeek } from "date-fns";
import { VehicleHealthCard } from "@/components/vehicles/health-card";
import { VehicleReplacementCard } from "@/components/vehicles/replacement-card";
import { SectionHeading } from "@/components/shared/section-heading";

interface VehicleProfilePageProps {
  params: { id: string };
  searchParams: { page?: string; dateFrom?: string; dateTo?: string; type?: string };
}

export default async function VehicleProfilePage({ params, searchParams }: VehicleProfilePageProps) {
  const detail = await getVehicleDetail(params.id);
  if (!detail) notFound();

  const { vehicle, incomeCents, expenseCents, repairsCents, netProfitCents, emiBalanceCents, roiPercent, kmSincePurchase, service, recentRepairs, highRepairCost } =
    detail;

  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const recentMileage = await prisma.mileageEntry.findFirst({
    where: { vehicleId: vehicle.id, date: { gte: startOfCurrentWeek } },
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

  const { recommended: replaceRecommended, reasons: replaceReasons } = checkVehicleReplacementCriteria({
    currentMileageKm: vehicle.currentMileageKm,
    purchaseDate: vehicle.purchaseDate,
    roiPercent: roiPercent,
    repairsCostCents: repairsCents,
    totalIncomeCents: incomeCents,
    profitPerKmCents: kmSincePurchase > 0 ? netProfitCents / kmSincePurchase : null,
  });

  const [timeline, monthlyFinancials] = await Promise.all([
    getVehicleTimeline(vehicle.id, {
      page: Number(searchParams.page ?? "1") || 1,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
      type: searchParams.type === "transactions" || searchParams.type === "notes" ? searchParams.type : "all",
    }),
    getVehicleMonthlyFinancials(vehicle.id),
  ]);

  const registrationLine = vehicle.registration2 ? `${vehicle.registration} / ${vehicle.registration2}` : vehicle.registration;

  // Compute insurance display
  const insuranceDaysRemaining = vehicle.insuranceEndDate
    ? differenceInCalendarDays(vehicle.insuranceEndDate, new Date())
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

      {/* ── Scannable Status Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Status</p>
          <p className={`mt-1 font-semibold ${vehicle.active ? "text-status-success" : "text-status-error"}`}>
            {vehicle.active ? "Operational" : "Inactive"}
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
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Revenue</p>
          <p className="mt-1 font-semibold text-brand-blue font-mono-figures">{formatZAR(incomeCents)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Profit</p>
          <p className={`mt-1 font-semibold font-mono-figures ${netProfitCents >= 0 ? "text-status-success" : "text-status-error"}`}>
            {formatZAR(netProfitCents)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VehicleHealthCard score={health.score} reasons={health.reasons} categories={health.categories} />
        <VehicleReplacementCard recommended={replaceRecommended} reasons={replaceReasons} />
      </div>

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
          title="Financial Performance"
          fields={[
            { label: "Total Income", value: formatZAR(incomeCents) },
            { label: "Total Expenses", value: formatZAR(expenseCents) },
            { label: "Repairs Cost", value: formatZAR(repairsCents) },
            { label: "Net P/L", value: formatZAR(netProfitCents) },
            { label: "Margin", value: formatMargin(incomeCents, expenseCents) },
            { label: "ROI on Purchase", value: roiPercent === null ? "—" : `${roiPercent.toFixed(1)}%` },
            { label: "Revenue / KM", value: kmSincePurchase > 0 ? formatZAR(Math.round(incomeCents / kmSincePurchase)) : "—" },
            { label: "Cost / KM", value: kmSincePurchase > 0 ? formatZAR(Math.round(expenseCents / kmSincePurchase)) : "—" },
            { label: "Profit / KM", value: kmSincePurchase > 0 ? formatZAR(Math.round(netProfitCents / kmSincePurchase)) : "—" },
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

      <section className="space-y-3">
        <SectionHeading title="Monthly Financials" />
        <FinancialChart data={monthlyFinancials} />
      </section>

      <section className="space-y-3">
        <SectionHeading title="Activity Timeline" />
        <ActivityTimeline timeline={timeline} />
      </section>
    </div>
  );
}
