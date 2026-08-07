export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCategoryBreakdown, getVehiclePerformanceRanking } from "@/lib/db/analytics";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireSession();
    const [categoryBreakdown, vehicleRanking] = await Promise.all([
      getCategoryBreakdown(),
      getVehiclePerformanceRanking(),
    ]);
    return NextResponse.json({ categoryBreakdown, vehicleRanking });
  } catch (error) {
    return handleApiError(error);
  }
}
