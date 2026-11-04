export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getTransactionById, updateTransaction, softDeleteTransaction } from "@/lib/db/transactions";
import { requireSession, requireAdmin, handleApiError, jsonError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireSession();
    const transaction = await getTransactionById(params.id);
    if (!transaction) return jsonError("Transaction not found", 404);
    return NextResponse.json({ transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const transaction = await updateTransaction(params.id, body);
    invalidateFleetData(transaction.vehicleId);
    return NextResponse.json({ transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const transaction = await softDeleteTransaction(params.id);
    invalidateFleetData(transaction.vehicleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
