export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getVehicleDetail } from "@/lib/db/vehicles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoCard } from "@/components/vehicles/info-card";
import { ActivityTimeline } from "@/components/vehicles/activity-timeline";
import { DeactivateVehicleButton } from "@/components/vehicles/deactivate-vehicle-button";
import { formatZAR, formatKm, formatDate, formatMargin } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import { getVehicleTimeline } from "@/lib/db/vehicles";

interface VehicleProfilePageProps {
  params: { id: string };
  searchParams: { page?: string; dateFrom?: string; dateTo?: string; type?: string };
}

export default async function VehicleProfilePage({ params, searchParams }: VehicleProfilePageProps) {
  const detail = await getVehicleDetail(params.id);
  if (!detail) notFound();

  const { vehicle, incomeCents, expenseCents, repairsCents, netProfitCents, emiBalanceCents, roiPercent, kmSincePurchase, service } =
    detail;

  const timeline = await getVehicleTimeline(vehicle.id, {
    page: Number(searchParams.page ?? "1") || 1,
    dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
    dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
    type: searchParams.type === "transactions" || searchParams.type === "notes" ? searchParams.type : "all",
  });

  const registrationLine = vehicle.registration2 ? `${vehicle.registration} / ${vehicle.registration2}` : vehicle.registration;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-navy px-2.5 py-1 text-sm font-semibold text-white">
              {vehicle.id}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {vehicle.make} {vehicle.model}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted">{registrationLine}</p>
        </div>
        <div className="flex items-center gap-2">
          {!vehicle.active && <Badge variant="outline">Inactive</Badge>}
          <Button asChild variant="outline">
            <Link href={`/vehicles/${vehicle.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          {vehicle.active && <DeactivateVehicleButton vehicleId={vehicle.id} />}
        </div>
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
        <h2 className="text-lg font-semibold tracking-tight text-ink">Activity Timeline</h2>
        <ActivityTimeline timeline={timeline} />
      </section>
    </div>
  );
}
