export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { deleteNote } from "@/lib/db/notes";
import { requireSession, handleApiError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    await deleteNote(params.id);
    invalidateFleetData();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
