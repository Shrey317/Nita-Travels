import { NextResponse } from 'next/server';
import { requireSession, handleApiError } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { documentSchema } from '@/lib/schemas/operations.schema';
import { verifyNewAttachments } from '@/lib/verify-attachments';
import { invalidateFleetData } from '@/lib/invalidate-fleet';
export async function POST(request: Request) {
  try {
    await requireSession();
    const data = documentSchema.parse(await request.json());
    await verifyNewAttachments(data.photoUrls, []);
    const record = await prisma.$transaction(async tx => {
      await tx.vehicle.findUniqueOrThrow({ where: { id: data.vehicleId, deletedAt: null } });
      return tx.fleetDocument.create({ data });
    });
    invalidateFleetData();
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
