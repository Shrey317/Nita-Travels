import type { Prisma } from '@prisma/client';
import { ValidationError } from '@/lib/errors';
export async function validateWorkOrderExpense(tx: Prisma.TransactionClient, vehicleId: string, transactionId?: string | null) {
  if (!transactionId) return;
  const expense = await tx.transaction.findUnique({ where: { id: transactionId, deletedAt: null } });
  if (!expense || expense.vehicleId !== vehicleId || expense.incomeZarCents > 0 || (expense.expenseZarCents === 0 && expense.category !== 'Service')) {
    throw new ValidationError('Choose an existing company expense for this vehicle, or a zero-cost service record.');
  }
}
