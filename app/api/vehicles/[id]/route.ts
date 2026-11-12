import { changeRoute } from '@/lib/change-route';
import { NextResponse } from 'next/server';
import { getVehicleDetail } from '@/lib/db/vehicles';
import { requireSession, handleApiError, jsonError } from '@/lib/api-response';
export async function GET(_request: Request, props: Props) {
  try {
    const session = await requireSession();
    const detail = await getVehicleDetail((await props.params).id, session.staffRole === 'ADMIN');
    return detail ? NextResponse.json(detail) : jsonError('Vehicle not found', 404);
  } catch (error) { return handleApiError(error); }
}

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, props: Props) {
  return changeRoute(request, (await props.params).id, 'vehicle', 'vehicle');
}

export async function DELETE(request: Request, props: Props) {
  return changeRoute(request, (await props.params).id, 'vehicle', 'vehicle');
}
