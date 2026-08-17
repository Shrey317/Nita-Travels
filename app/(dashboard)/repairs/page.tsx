export const dynamic = "force-dynamic";

import { getTransactions, getRepairsSummary, getRepairsAnomalies } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { RepairsSummaryCards } from "@/components/repairs/repairs-summary-cards";
import { RepairsAnomalies } from "@/components/repairs/repairs-anomalies";
import { RepairsTable } from "@/components/repairs/repairs-table";
import { VehicleDateFilters } from "@/components/shared/vehicle-date-filters";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { REPAIR_CATEGORIES, DEFAULT_PAGE_SIZE, FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";
import { toStringArray } from "@/lib/utils";

interface RepairsPageProps {
  searchParams: { vehicleId?: string | string[]; dateFrom?: string; dateTo?: string; page?: string };
}

export default async function RepairsPage({ searchParams }: RepairsPageProps) {
  const vehicleId = toStringArray(searchParams.vehicleId);
  const page = Number(searchParams.page ?? "1") || 1;

  const [vehicles, summary, anomalies, result] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getRepairsSummary(),
    getRepairsAnomalies(),
    getTransactions({
      category: [...REPAIR_CATEGORIES],
      vehicleId: vehicleId.length ? vehicleId : undefined,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const vehicleOptions = [
    ...vehicleIdOptions(vehicles),
    { value: FLEET_WIDE_VEHICLE_ID, label: "All Vehicles / Fleet-Wide" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Repairs Log</h1>
        <p className="text-sm text-muted">Read-only view of Repairs, Brake Pads, and Tyres transactions.</p>
      </div>

      <RepairsSummaryCards summary={summary} />
      <RepairsAnomalies anomalies={anomalies} />
      <VehicleDateFilters vehicleOptions={vehicleOptions} idPrefix="repairs" />
      <RepairsTable transactions={result.items} />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
