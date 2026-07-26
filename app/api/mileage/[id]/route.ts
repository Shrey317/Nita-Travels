import { NextRequest, NextResponse } from "next/server";
import { deleteMileageEntry } from "@/lib/db/mileage";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    await deleteMileageEntry(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
