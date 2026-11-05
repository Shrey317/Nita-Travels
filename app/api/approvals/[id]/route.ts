import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleApiError } from '@/lib/api-response';
import { decideChange } from '@/lib/changes';
import { invalidateFleetData } from '@/lib/invalidate-fleet';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const input = z.object({ approve: z.boolean(), note: z.string().trim().max(1000).default('') }).strict().parse(await request.json());
    const result = await decideChange({ id: session.staffId!, role: 'ADMIN' }, (await props.params).id, input.approve, input.note);
    invalidateFleetData();
    return NextResponse.json(result);
  } catch (error) { return handleApiError(error); }
}
