export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getMileageEntryById, updateMileageEntry, softDeleteMileageEntry } from "@/lib/db/mileage";
import { requireSession, requireAdmin, handleApiError, jsonError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireSession();
    const entry = await getMileageEntryById(params.id);
    if (!entry) return jsonError("Mileage entry not found", 404);
    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const entry = await updateMileageEntry(params.id, body);
    invalidateFleetData(entry.vehicleId);
    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const entry = await softDeleteMileageEntry(params.id);
    invalidateFleetData(entry.vehicleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
