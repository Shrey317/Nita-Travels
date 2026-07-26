export const dynamic = "force-dynamic";

import { getNotes } from "@/lib/db/notes";
import { prisma } from "@/lib/db/client";
import { NoteForm } from "@/components/notes/note-form";
import { NotesTable } from "@/components/notes/notes-table";
import { VehicleDateFilters } from "@/components/shared/vehicle-date-filters";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { DEFAULT_PAGE_SIZE, FLEET_WIDE_VEHICLE_ID, NO_VEHICLE_FILTER_VALUE } from "@/lib/constants";
import { toStringArray } from "@/lib/utils";

interface NotesPageProps {
  searchParams: { vehicleId?: string | string[]; dateFrom?: string; dateTo?: string; page?: string };
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const vehicleIdFilter = toStringArray(searchParams.vehicleId);
  const page = Number(searchParams.page ?? "1") || 1;

  const [vehicles, result] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getNotes({
      vehicleId: vehicleIdFilter.length ? vehicleIdFilter : undefined,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const filterVehicleOptions = [
    ...vehicleIdOptions(vehicles),
    { value: FLEET_WIDE_VEHICLE_ID, label: "All Vehicles / Fleet-Wide" },
    { value: NO_VEHICLE_FILTER_VALUE, label: "No Specific Vehicle" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Vehicle Notes</h1>
        <p className="text-sm text-muted">Driver changes, accidents, and general fleet news — free text, no categories.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <NoteForm vehicles={vehicles} />
      </div>

      <section className="space-y-4">
        <VehicleDateFilters vehicleOptions={filterVehicleOptions} idPrefix="notes" />
        <NotesTable notes={result.items} vehicles={vehicles} />
        <Pagination page={result.page} limit={result.limit} total={result.total} />
      </section>
    </div>
  );
}
