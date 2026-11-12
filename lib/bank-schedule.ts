import { money, sumMoney } from './rto';
import { Prisma } from '@prisma/client';
/** Monthly contractual cash obligations, allocated oldest first. Not a principal estimate. */
export function bankSchedule(firstDueDate: Date | null, term: number, monthlyAmount: Prisma.Decimal.Value, payments: { date: Date; amount: Prisma.Decimal.Value; reversedAt: Date | null }[], asOf = new Date(), frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' = 'MONTHLY', maturityDate?: Date) {
  if (!firstDueDate) return null;
  let credit = sumMoney(payments.filter(p => p.date <= asOf && (!p.reversedAt || p.reversedAt > asOf)).map(p => p.amount));
  const count = frequency === 'MONTHLY' ? term : frequency === 'QUARTERLY' ? Math.ceil(term / 3) : Math.ceil(term * 31 / (frequency === 'WEEKLY' ? 7 : 14));
  const end = maturityDate ?? new Date(Date.UTC(firstDueDate.getUTCFullYear(), firstDueDate.getUTCMonth() + term, firstDueDate.getUTCDate()));
  return Array.from({ length: count }, (_, sequence) => {
    const start = new Date(Date.UTC(firstDueDate.getUTCFullYear(), firstDueDate.getUTCMonth() + sequence * (frequency === 'QUARTERLY' ? 3 : 1), 1));
    const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(firstDueDate.getUTCDate(), lastDay));
    if (frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') start.setTime(+firstDueDate + sequence * (frequency === 'WEEKLY' ? 7 : 14) * 86400000);
    const allocated = Prisma.Decimal.min(credit, monthlyAmount); credit = credit.minus(allocated);
    return { sequence: sequence + 1, date: start, amount: money(monthlyAmount), balance: money(monthlyAmount).minus(allocated) };
  }).filter(row => row.date <= end);
}
