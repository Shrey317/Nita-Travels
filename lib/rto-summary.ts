import { businessToday, addDays, isoWeekStart } from './date-ranges';
import { money, sumMoney } from './rto';

export const rtoStatusLabel: Record<string, string> = { DRAFT: 'Not started', ACTIVE: 'Active', SUSPENDED: 'Paused', IN_DEFAULT: 'Needs attention', COMPLETED: 'Completed', TERMINATED: 'Ended', CANCELLED: 'Cancelled' };

export function paymentSummary(items: { date: Date; amount: string }[], today = businessToday()) {
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(isoWeekStart(today), 7);
  const total = (matches: (date: Date) => boolean) => sumMoney(items.filter(i => matches(i.date)).map(i => i.amount)).toFixed(2);
  return {
    overdue: total(date => date < today),
    dueToday: total(date => date >= today && date < tomorrow),
    laterThisWeek: total(date => date >= tomorrow && date < nextWeek),
    totalDue: total(date => date < tomorrow),
  };
}

export function depositProgress(remaining: string) {
  const left = money(remaining);
  const payments = left.div(650).ceil().toNumber();
  return { payments, finalPayment: payments ? left.minus(money(650).times(payments - 1)).toFixed(2) : '0.00' };
}
