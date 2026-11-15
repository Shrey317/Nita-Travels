import { Prisma } from '@prisma/client';
import { money, sumMoney } from './rto';

export const WEEKLY_DEPOSIT = '650.00';
type Receipt = { kind: string; amount: Prisma.Decimal.Value; depositAmount?: Prisma.Decimal.Value; reversedAt?: Date | null };
export function depositPart(p: Receipt) { return p.kind === 'UPFRONT' ? money(p.amount) : money(p.depositAmount ?? 0); }
export function rentPart(p: Receipt) { return p.kind === 'RENT' || p.kind === 'WEEKLY' ? money(p.amount).minus(p.depositAmount ?? 0) : money(0); }
export function depositPaid(payments: Receipt[]) { return sumMoney(payments.filter(p => !p.reversedAt).map(depositPart)); }
/** The deposit follows weekly rent dates. Prior deposit receipts cover the oldest weeks. */
export function depositWeeks(total: Prisma.Decimal.Value, paid: Prisma.Decimal.Value, count: number) {
  let remaining = money(total); let credit = money(paid);
  return Array.from({ length: count }, () => {
    const amount = Prisma.Decimal.min(remaining, money(WEEKLY_DEPOSIT));
    remaining = remaining.minus(amount);
    const covered = Prisma.Decimal.min(credit, amount); credit = credit.minus(covered);
    return { amount, balance: amount.minus(covered) };
  });
}
export function depositRemaining(total: Prisma.Decimal.Value, paid: Prisma.Decimal.Value) { return Prisma.Decimal.max(money(total).minus(paid), 0); }
/** Previous standalone deposits reduce the total to collect, not the R650 weekly top-up. */
export function depositSchedule(total: Prisma.Decimal.Value, payments: Receipt[], count: number) {
  const active = payments.filter(p => !p.reversedAt);
  const priorDeposit = sumMoney(active.filter(p => p.kind === 'UPFRONT').map(depositPart));
  const weeklyPaid = sumMoney(active.filter(p => p.kind !== 'UPFRONT').map(depositPart));
  return depositWeeks(depositRemaining(total, priorDeposit), weeklyPaid, count);
}
