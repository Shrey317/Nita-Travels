export const dynamic = "force-dynamic";

import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { isAdminSession } from "@/lib/api-response";
import { VehicleListClient } from "./client-page";

export default async function VehiclesPage() {
  // Preserve access to inactive vehicles and their history.
  const [vehicles, isAdmin] = await Promise.all([
    getVehiclesWithFinancials(undefined, undefined, true),
    isAdminSession(),
  ]);

  return <VehicleListClient initialVehicles={vehicles} isAdmin={isAdmin} />;
}
