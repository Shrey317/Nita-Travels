import { parsePageListQuery } from "@/lib/query-filters";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { getMileageEntries, getMileageViolations } from "@/lib/db/mileage";
import { prisma } from "@/lib/db/client";
import { isAdminSession } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { VehicleDateFilters } from "@/components/shared/vehicle-date-filters";
import { MileageTable } from "@/components/mileage/mileage-table";
import { OverLimitSummary } from "@/components/mileage/over-limit-summary";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { PageHeader } from "@/components/shared/page-header";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

interface MileagePageProps {
  searchParams: Promise<{ vehicleId?: string | string[]; dateFrom?: string; dateTo?: string; page?: string }>;
}

export default async function MileagePage(props: MileagePageProps) {
  const searchParams = await props.searchParams;
  const { filters, error: filterError } = parsePageListQuery(searchParams);
  const vehicleId = filters.vehicleId ?? [];
  const page = filters.page;

  const [isAdmin, vehicles, result, violations] = await Promise.all([
    isAdminSession(),
    prisma.vehicle.findMany({ where: { active: true, deletedAt: null }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getMileageEntries({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
    getMileageViolations(vehicleId.length ? vehicleId : undefined, filters.dateFrom, filters.dateTo),
  ]);

  return (
    <div className="space-y-6">
      {filterError && <p role="alert" className="rounded-lg border border-status-error p-4 text-status-error">{filterError}</p>}
      <PageHeader title="Mileage Log" description={`${result.total} entries · limit 2,250 km/week`}>
        <Button asChild>
          <Link href="/mileage/new">
            <Plus className="h-4 w-4" />
            Log Mileage
          </Link>
        </Button>
      </PageHeader>

      <VehicleDateFilters vehicleOptions={vehicleIdOptions(vehicles)} idPrefix="mileage" />
      <OverLimitSummary violations={violations} />
      <MileageTable entries={result.items} isAdmin={isAdmin} />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
