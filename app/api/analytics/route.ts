import { NextResponse } from "next/server";
import { getCategoryBreakdown, getVehiclePerformanceRanking } from "@/lib/db/analytics";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const [categoryBreakdown, vehicleRanking] = await Promise.all([
      getCategoryBreakdown(),
      getVehiclePerformanceRanking(),
    ]);
    return NextResponse.json({ categoryBreakdown, vehicleRanking });
  } catch (error) {
    return handleApiError(error);
  }
}
