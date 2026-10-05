export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVehicleDetail, updateVehicle, deactivateVehicle } from "@/lib/db/vehicles";
import { requireSession, handleApiError, jsonError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    await requireSession();
    const detail = await getVehicleDetail(params.id);
    if (!detail) return jsonError("Vehicle not found", 404);
    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    await requireSession();
    const body = await request.json();
    const vehicle = await updateVehicle(params.id, body);
    invalidateFleetData();
    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Soft-deactivate only — see lib/db/vehicles.ts. */
export async function DELETE(_request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    await requireSession();
    const vehicle = await deactivateVehicle(params.id);
    invalidateFleetData();
    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}
