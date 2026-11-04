export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getNoteById, softDeleteNote } from "@/lib/db/notes";
import { requireSession, requireAdmin, handleApiError, jsonError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireSession();
    const note = await getNoteById(params.id);
    if (!note) return jsonError("Note not found", 404);
    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const note = await softDeleteNote(params.id);
    invalidateFleetData(note.vehicleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
