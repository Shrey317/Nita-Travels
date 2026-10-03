import { prisma } from "@/lib/db/client";
import { formatMonthKey, formatMargin } from "@/lib/format";
import { getPeriodBreakdown } from "@/lib/db/periods";
import { businessToday, type ClosedDateRange } from "@/lib/date-ranges";

export interface MonthlyRow {
  monthKey: string; year: number; monthIndex: number; incomeCents: number; expenseCents: number;
  repairsCents: number; netProfitCents: number; marginLabel: string; hasData: boolean;
  mileageKm: number; maintenanceCents: number;
}
export async function getMonthlyBreakdown(year: number, range?: ClosedDateRange, vehicleId?: string): Promise<MonthlyRow[]> {
  const rows = await getPeriodBreakdown(range ?? { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year, 11, 31)) }, "month", vehicleId);
  return rows.map(row => ({ monthKey: formatMonthKey(row.from), year: row.from.getUTCFullYear(), monthIndex: row.from.getUTCMonth(),
    incomeCents: row.incomeCents, expenseCents: row.expenseCents, repairsCents: row.repairsCents,
    netProfitCents: row.netProfitCents, marginLabel: formatMargin(row.incomeCents, row.expenseCents), hasData: row.hasData,
    mileageKm: row.mileageKm, maintenanceCents: row.maintenanceCents }));
}
export async function getAvailableYears(): Promise<number[]> {
  const result = await prisma.transaction.aggregate({ _min: { date: true }, _max: { date: true }, where: { deletedAt: null } });
  const year = businessToday().getUTCFullYear();
  const min = Math.min(result._min.date?.getUTCFullYear() ?? year, year);
  const max = Math.max(result._max.date?.getUTCFullYear() ?? year, year);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}
