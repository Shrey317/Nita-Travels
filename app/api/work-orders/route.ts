import { NextResponse } from 'next/server';
import { requireSession, handleApiError } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { workOrderSchema } from '@/lib/schemas/operations.schema';
import { validateWorkOrderExpense } from '@/lib/work-order-validation';
import { invalidateFleetData } from '@/lib/invalidate-fleet';
export async function POST(request: Request) {
  try {
    await requireSession();
    const data = workOrderSchema.parse(await request.json());
    const record = await prisma.$transaction(async tx => {
      await tx.vehicle.findUniqueOrThrow({ where: { id: data.vehicleId, deletedAt: null } });
      await validateWorkOrderExpense(tx, data.vehicleId, data.expenseTransactionId);
      return tx.workOrder.create({ data });
    });
    invalidateFleetData();
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
