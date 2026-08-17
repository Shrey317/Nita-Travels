export const dynamic = "force-dynamic";

import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { VehicleListClient } from "./client-page";

export default async function VehiclesPage() {
  // Pass true to get inactive vehicles as well for filtering
  // Wait, getVehiclesWithFinancials() only returns active vehicles!
  // I need to change that or use a new method.
  // Actually, I can just use getVehiclesWithFinancials() but change it to accept an `includeInactive` flag.
  const vehicles = await getVehiclesWithFinancials(undefined, undefined, true);

  return <VehicleListClient initialVehicles={vehicles} />;
}
