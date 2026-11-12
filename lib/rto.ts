import { Prisma, type RtoStatus } from '@prisma/client';
import { ValidationError } from './errors';

export const DAY = 86400000;
export const WEEK = 7 * DAY;
export const money = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value).toDecimalPlaces(2);
export const sumMoney = (values: Prisma.Decimal.Value[]) => values.reduce<Prisma.Decimal>((a, b) => a.plus(b), money(0));
export const DEFAULT_TERMS = { version: 1, weeklyKm: 2000, excessPerKm: '1.50', repairDriverPercent: 50, serviceDriverPercent: 0, insuranceIncluded: true, downtimeExtends: true, ownershipCosts: 'DRIVER', refundTreatment: 'LEGAL_REVIEW_REQUIRED' };
export function defaultWeeklyAmount(year: number) { return year >= 2025 ? '2850.00' : '2650.00'; }
export const transitions: Record<RtoStatus, RtoStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'], ACTIVE: ['SUSPENDED', 'IN_DEFAULT', 'COMPLETED', 'TERMINATED'],
  SUSPENDED: ['ACTIVE', 'IN_DEFAULT', 'TERMINATED'], IN_DEFAULT: ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
  COMPLETED: [], TERMINATED: [], CANCELLED: [],
};
export function assertTransition(from: RtoStatus, to: RtoStatus) {
  if (!transitions[from].includes(to)) throw new ValidationError(`Cannot change ${from} to ${to}.`);
}
export function repairSplit(invoice: string, recovery: string) {
  const net = money(invoice).minus(recovery);
  if (net.isNegative()) throw new ValidationError('Recoveries cannot exceed the invoice.');
  const driver = net.div(2).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
  return { driver, company: net.minus(driver) };
}
// Each obligation is due after seven chargeable days. Half-open downtime intervals
// pause the clock, including partial days; overlap is rejected by the mutation layer.
export function dueDates(start: Date, weeks: number, downtime: { startsAt: Date; endsAt: Date | null }[], now = new Date()) {
  const periods = [...downtime].sort((a, b) => +a.startsAt - +b.startsAt);
  return Array.from({ length: weeks }, (_, i) => {
    let due = +start + (i + 1) * WEEK;
    for (const period of periods) {
      const begin = Math.max(+start, +period.startsAt);
      const end = +(period.endsAt ?? now);
      if (begin < due && end > begin) due += end - begin;
    }
    return new Date(due);
  });
}
export function installmentBalance(amount: Prisma.Decimal.Value, allocations: { amount: Prisma.Decimal.Value; payment: { reversedAt: Date | null } }[]) {
  return money(amount).minus(sumMoney(allocations.filter(a => !a.payment.reversedAt).map(a => a.amount)));
}
export function mileageCharge(distance: number, days: number) {
  if (days !== 7) throw new ValidationError('Mileage billing requires readings exactly seven days apart; irregular readings require review.');
  if (distance < 0) throw new ValidationError('Odometer cannot decrease.');
  return { excessKm: Math.max(0, distance - 2000), amount: money(Math.max(0, distance - 2000)).times('1.50') };
}
