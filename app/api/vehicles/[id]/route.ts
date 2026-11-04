export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVehicleDetail, updateVehicle, softDeleteVehicle } from "@/lib/db/vehicles";
import { requireSession, requireAdmin, handleApiError, jsonError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireSession();
    const detail = await getVehicleDetail(params.id);
    if (!detail) return jsonError(`Vehicle ${params.id} not found`, 404);
    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const vehicle = await updateVehicle(params.id, body);
    invalidateFleetData(vehicle.id);
    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const vehicle = await softDeleteVehicle(params.id);
    invalidateFleetData(vehicle.id);
    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}
