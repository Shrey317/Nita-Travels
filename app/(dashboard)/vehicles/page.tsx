export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";

export default async function VehiclesPage() {
  const vehicles = await getVehiclesWithFinancials();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Vehicles</h1>
          <p className="text-sm text-muted">{vehicles.length} active in the fleet</p>
        </div>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted">No vehicles yet.</p>
          <Button asChild className="mt-4">
            <Link href="/vehicles/new">
              <Plus className="h-4 w-4" />
              Add your first vehicle
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.vehicle.id} {...v} />
          ))}
        </div>
      )}
    </div>
  );
}
