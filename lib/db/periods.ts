import { prisma } from "@/lib/db/client";
import { aggregatePeriods } from "@/lib/periods";
import { addDays, type ClosedDateRange } from "@/lib/date-ranges";
import { ValidationError } from "@/lib/errors";

export async function getPeriodBreakdown(range: ClosedDateRange, frequency: "week" | "month", vehicleId?: string) {
  if (!Number.isFinite(range.from.getTime()) || !Number.isFinite(range.to.getTime()) || range.from > range.to) throw new ValidationError("Choose a valid ordered date range.");
  const where = { date: { gte: range.from, lt: addDays(range.to, 1) }, ...(vehicleId ? { vehicleId } : {}) };
  const [transactions, mileage] = await Promise.all([
    prisma.transaction.findMany({ where: { ...where, deletedAt: null }, select: { id: true, date: true, vehicleId: true, category: true, incomeZarCents: true, expenseZarCents: true } }),
    prisma.mileageEntry.findMany({ where, select: { id: true, date: true, vehicleId: true, previousMileageKm: true, currentMileageKm: true, distanceDrivenKm: true } }),
  ]);
  return aggregatePeriods(transactions, mileage, range, frequency);
}
