export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { deleteMileageEntry, updateMileageEntry } from "@/lib/db/mileage";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const body = await request.json();
    const entry = await updateMileageEntry(params.id, { currentMileageKm: body.currentMileageKm });
    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    await deleteMileageEntry(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

