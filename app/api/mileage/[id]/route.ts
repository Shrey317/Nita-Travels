export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { deleteMileageEntry, updateMileageEntry } from "@/lib/db/mileage";
import { requireSession, handleApiError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";
import { z } from "zod";
import { positiveIntegerSchema } from "@/lib/schemas/common.schema";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const body = z.object({ currentMileageKm: positiveIntegerSchema }).parse(await request.json());
    const entry = await updateMileageEntry(params.id, body);
    invalidateFleetData();
    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    await deleteMileageEntry(params.id);
    invalidateFleetData();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

