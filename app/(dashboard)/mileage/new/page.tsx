export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/client";
import { MileageForm } from "@/components/mileage/mileage-form";

export default async function NewMileagePage({ searchParams }: { searchParams: { vehicleId?: string } }) {
  const vehicles = await prisma.vehicle.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, registration: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Log Mileage</h1>
        <p className="text-sm text-muted">Previous mileage is fetched automatically — you only enter the new reading.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <MileageForm vehicles={vehicles} initialVehicleId={searchParams.vehicleId} />
      </div>
    </div>
  );
}
