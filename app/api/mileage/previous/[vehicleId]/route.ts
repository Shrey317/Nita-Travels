export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPreviousMileage } from "@/lib/db/mileage";
import { handleApiError } from "@/lib/api-response";

export async function GET(_request: Request, { params }: { params: { vehicleId: string } }) {
  try {
    const previousMileageKm = await getPreviousMileage(params.vehicleId);
    return NextResponse.json({ previousMileageKm });
  } catch (error) {
    return handleApiError(error);
  }
}
