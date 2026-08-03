export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/lib/db/transactions";
import { requireSession, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const body = await request.json();
    const transaction = await updateTransaction(params.id, body);
    return NextResponse.json({ transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    await deleteTransaction(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
