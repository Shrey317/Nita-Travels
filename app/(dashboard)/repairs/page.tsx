import { parsePageListQuery } from "@/lib/query-filters";
export const dynamic = "force-dynamic";

import { getTransactions, getRepairsSummary, getRepairsAnomalies } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { RepairsSummaryCards } from "@/components/repairs/repairs-summary-cards";
import { RepairsAnomalies } from "@/components/repairs/repairs-anomalies";
import { RepairsTable } from "@/components/repairs/repairs-table";
import { VehicleDateFilters } from "@/components/shared/vehicle-date-filters";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { PageHeader } from "@/components/shared/page-header";
import { REPAIR_CATEGORIES, DEFAULT_PAGE_SIZE, FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";

interface RepairsPageProps {
  searchParams: Promise<{ vehicleId?: string | string[]; dateFrom?: string; dateTo?: string; page?: string }>;
}

export default async function RepairsPage(props: RepairsPageProps) {
  const searchParams = await props.searchParams;
  const { filters, error: filterError } = parsePageListQuery(searchParams);
  const vehicleId = filters.vehicleId ?? [];
  const page = filters.page;

  const [vehicles, summary, anomalies, result] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true, deletedAt: null }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getRepairsSummary(),
    getRepairsAnomalies(),
    getTransactions({
      category: [...REPAIR_CATEGORIES],
      vehicleId: vehicleId.length ? vehicleId : undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
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
      {filterError && <p role="alert" className="rounded-lg border border-status-error p-4 text-status-error">{filterError}</p>}
      <PageHeader title="Repairs Log" description="Read-only view of Repairs, Brake Pads, and Tyres transactions." />

      <p className="text-sm text-muted">Summary: all recorded repairs. Alerts: current fleet activity over the last 30 days. Filters below apply to the transaction table.</p>
      <RepairsSummaryCards summary={summary} />
      <RepairsAnomalies anomalies={anomalies} />
      <VehicleDateFilters vehicleOptions={vehicleOptions} idPrefix="repairs" />
      <RepairsTable transactions={result.items} />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
