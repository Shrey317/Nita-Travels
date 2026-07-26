import { NextRequest, NextResponse } from "next/server";
import { getVehicleDetail, updateVehicle, deactivateVehicle } from "@/lib/db/vehicles";
import { requireSession, handleApiError, jsonError } from "@/lib/api-response";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const detail = await getVehicleDetail(params.id);
    if (!detail) return jsonError("Vehicle not found", 404);
    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const body = await request.json();
    const vehicle = await updateVehicle(params.id, body);
    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Soft-deactivate only — see lib/db/vehicles.ts. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const vehicle = await deactivateVehicle(params.id);
    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}
