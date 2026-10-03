export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVehiclesWithFinancials, createVehicle } from "@/lib/db/vehicles";
import { requireSession, handleApiError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET() {
  try {
    await requireSession();
    const vehicles = await getVehiclesWithFinancials();
    return NextResponse.json({ vehicles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const vehicle = await createVehicle(body);
    invalidateFleetData();
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
