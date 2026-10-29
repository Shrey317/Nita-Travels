import { requireSession, handleApiError } from '@/lib/api-response';
import { changeRecord, type ChangeEntity } from '@/lib/changes';
import { NextResponse } from 'next/server';
import { invalidateFleetData } from '@/lib/invalidate-fleet';
import { UnauthorizedError } from '@/lib/errors';

export async function requireActor() {
  const session = await requireSession();
  if (!session.staffId || !session.staffRole) throw new UnauthorizedError();
  return { id: session.staffId, role: session.staffRole };
}

export async function changeRoute(request: Request, id: string, entity: ChangeEntity, key: string) {
  try {
    const actor = await requireActor();
    const result = await changeRecord(actor, entity, id, request.method === 'DELETE' ? 'DELETE' : 'UPDATE', request.method === 'DELETE' ? {} : await request.json());
    if (result.pendingApproval) return NextResponse.json(result, { status: 202 });
    invalidateFleetData();
    return NextResponse.json({ [key]: result.result, success: true });
  } catch (error) { return handleApiError(error); }
}
