export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/lib/db/transactions";
import { requireSession, handleApiError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    await requireSession();
    const body = await request.json();
    const transaction = await updateTransaction(params.id, body);
    invalidateFleetData();
    return NextResponse.json({ transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    await requireSession();
    await deleteTransaction(params.id);
    invalidateFleetData();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
