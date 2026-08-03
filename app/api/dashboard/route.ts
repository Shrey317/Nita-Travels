export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { getFleetTotals } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { SERVICE_STATUS_SORT_ORDER } from "@/lib/service";
import { handleApiError } from "@/lib/api-response";

/**
 * SRS 16: "KPI totals + vehicle summary + service overview." The Dashboard page itself calls
 * getVehiclesWithFinancials()/getFleetTotals() directly for its initial server render (faster,
 * no extra hop) — this route exists in parallel for API-contract completeness and any other
 * consumer, and is a thin wrapper over the exact same lib/db functions, not a second
 * implementation of the aggregation logic.
 */
export async function GET() {
  try {
    const [vehicles, fleetTotals, activeVehicleCount] = await Promise.all([
      getVehiclesWithFinancials(),
      getFleetTotals(),
      prisma.vehicle.count({ where: { active: true } }),
    ]);

    const serviceOverview = vehicles
      .map((v) => v.service)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => SERVICE_STATUS_SORT_ORDER[a.status] - SERVICE_STATUS_SORT_ORDER[b.status]);

    return NextResponse.json({
      kpis: { ...fleetTotals, fleetSize: activeVehicleCount },
      vehicleSummary: vehicles,
      serviceOverview,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
