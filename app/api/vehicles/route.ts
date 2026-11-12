export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVehiclesWithFinancials, createVehicle } from "@/lib/db/vehicles";
import { requireSession, handleApiError } from "@/lib/api-response";
import { invalidateFleetData } from "@/lib/invalidate-fleet";
import { PRIVATE_FINANCE_FIELDS } from '@/lib/private-finance';
import { ForbiddenError } from '@/lib/errors';

export async function GET() {
  try {
    await requireSession();
    const vehicles = await getVehiclesWithFinancials();
    return NextResponse.json({ vehicles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    if (session.staffRole !== 'ADMIN' && PRIVATE_FINANCE_FIELDS.some(key => body?.[key] !== undefined && body[key] !== null && body[key] !== 0 && body[key] !== '')) throw new ForbiddenError('Only administrators may record bank-finance details.');
    const vehicle = await createVehicle(body);
    invalidateFleetData();
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
