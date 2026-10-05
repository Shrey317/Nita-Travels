export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { getMileageEntries } from "@/lib/db/mileage";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { MileageTable } from "@/components/mileage/mileage-table";
import { LatestMileageTable } from "@/components/mileage/latest-mileage-table";
import { VehicleDateFilters } from "@/components/shared/vehicle-date-filters";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { toStringArray } from "@/lib/utils";
import { MileageAlerts } from "@/components/mileage/mileage-alerts";
import { PageHeader } from "@/components/shared/page-header";
import { addDays, businessToday, isoWeekStart } from "@/lib/date-ranges";
import { analyzeMileage } from "@/lib/analytics";
import { WEEKLY_MILEAGE_LIMIT } from "@/lib/mileage";

interface MileagePageProps {
  searchParams: Promise<{ vehicleId?: string | string[]; dateFrom?: string; dateTo?: string; page?: string }>;
}

export default async function MileagePage(props: MileagePageProps) {
  const searchParams = await props.searchParams;
  const vehicleId = toStringArray(searchParams.vehicleId);
  const page = Number(searchParams.page ?? "1") || 1;

  const [vehicles, result] = await Promise.all([
    prisma.vehicle.findMany({
      where: { active: true, deletedAt: null },
      select: { 
        id: true, 
        registration: true, 
        currentMileageKm: true,
        mileageEntries: { orderBy: { date: 'desc' }, take: 1, select: { date: true } }
      },
      orderBy: { id: "asc" }
    }),
    getMileageEntries({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const today = businessToday();
  const startOfCurrentWeek = isoWeekStart(today);
  const recentEntries = await prisma.mileageEntry.findMany({
    where: { date: { gte: startOfCurrentWeek, lt: addDays(today, 1) }, vehicle: { active: true, deletedAt: null } },
    orderBy: { date: 'desc' }
  });

  const vehiclesWithRecentMileage = new Set(recentEntries.map(e => e.vehicleId));
  const missingMileageVehicles = vehicles.filter(v => !vehiclesWithRecentMileage.has(v.id));

  const overLimitVehicles = analyzeMileage(recentEntries, { from: startOfCurrentWeek, to: addDays(startOfCurrentWeek, 6) }).violations.flatMap(week => {
    const vehicle = vehicles.find(row => row.id === week.vehicleId);
    return vehicle ? [{ vehicle, overBy: week.km - WEEKLY_MILEAGE_LIMIT }] : [];
  });

  const exportParams = new URLSearchParams();
  for (const v of vehicleId) exportParams.append("vehicleId", v);
  if (searchParams.dateFrom) exportParams.set("dateFrom", searchParams.dateFrom);
  if (searchParams.dateTo) exportParams.set("dateTo", searchParams.dateTo);

  return (
    <div className="space-y-6">
      <PageHeader title="Mileage Log" description={`${result.total} entries logged`}>
        <Button asChild variant="outline">
          <a href={`/api/mileage/export?${exportParams.toString()}`}>
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </Button>
        <Button asChild>
          <Link href="/mileage/new">
            <Plus className="h-4 w-4" />
            Log Mileage
          </Link>
        </Button>
      </PageHeader>

      <MileageAlerts missingMileageVehicles={missingMileageVehicles} overLimitVehicles={overLimitVehicles} />

      <LatestMileageTable vehicles={vehicles} />

      <VehicleDateFilters vehicleOptions={vehicleIdOptions(vehicles)} idPrefix="mileage" />
      <MileageTable entries={result.items} />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
