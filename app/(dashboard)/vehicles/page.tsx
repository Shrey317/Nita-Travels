export const dynamic = "force-dynamic";

import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { VehicleListClient } from "./client-page";

export default async function VehiclesPage() {
  // Preserve access to inactive vehicles and their history.
  const vehicles = await getVehiclesWithFinancials(undefined, undefined, true);

  return <VehicleListClient initialVehicles={vehicles} />;
}
