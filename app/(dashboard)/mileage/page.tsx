export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { getMileageEntries } from "@/lib/db/mileage";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { MileageTable } from "@/components/mileage/mileage-table";
import { VehicleDateFilters } from "@/components/shared/vehicle-date-filters";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { toStringArray } from "@/lib/utils";
import { MileageAlerts } from "@/components/mileage/mileage-alerts";
import { PageHeader } from "@/components/shared/page-header";
import { startOfWeek } from "date-fns";

interface MileagePageProps {
  searchParams: { vehicleId?: string | string[]; dateFrom?: string; dateTo?: string; page?: string };
}

export default async function MileagePage({ searchParams }: MileagePageProps) {
  const vehicleId = toStringArray(searchParams.vehicleId);
  const page = Number(searchParams.page ?? "1") || 1;

  const [vehicles, result] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true, deletedAt: null }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getMileageEntries({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const recentEntries = await prisma.mileageEntry.findMany({
    where: { date: { gte: startOfCurrentWeek } },
    orderBy: { date: 'desc' }
  });

  const vehiclesWithRecentMileage = new Set(recentEntries.map(e => e.vehicleId));
  const missingMileageVehicles = vehicles.filter(v => !vehiclesWithRecentMileage.has(v.id));
  
  const overLimitVehicles = [];
  const processed = new Set();
  for (const e of recentEntries) {
    if (!processed.has(e.vehicleId)) {
      processed.add(e.vehicleId);
      if (e.overLimitByKm && e.overLimitByKm > 0) {
        const v = vehicles.find(veh => veh.id === e.vehicleId);
        if (v) overLimitVehicles.push({ vehicle: v, overBy: e.overLimitByKm });
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mileage Log" description={`${result.total} entries logged`}>
        <Button asChild>
          <Link href="/mileage/new">
            <Plus className="h-4 w-4" />
            Log Mileage
          </Link>
        </Button>
      </PageHeader>

      <MileageAlerts missingMileageVehicles={missingMileageVehicles} overLimitVehicles={overLimitVehicles} />

      <VehicleDateFilters vehicleOptions={vehicleIdOptions(vehicles)} idPrefix="mileage" />
      <MileageTable entries={result.items} />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
