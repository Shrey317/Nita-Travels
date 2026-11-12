import { z } from 'zod';
import { prisma } from './client';
import { calendarDateSchema } from '../schemas/common.schema';
import { dueDates, installmentBalance, sumMoney } from '../rto';
import { ValidationError } from '../errors';
export function reportRange(params: Record<string, string | undefined>) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const from = calendarDateSchema.parse(params.from ?? `${today.slice(0, 7)}-01`);
  const to = calendarDateSchema.parse(params.to ?? today);
  if (to < from) throw new ValidationError('End date must follow start date.');
  return { from, to, until: new Date(+to + 86400000), page: z.coerce.number().int().min(1).catch(1).parse(params.page) };
}
export async function rtoReport(params: Record<string, string | undefined>) {
  const range = reportRange(params);
  const agreements = await prisma.rtoAgreement.findMany({ where: { ...(params.status ? { status: z.enum(['DRAFT','ACTIVE','SUSPENDED','IN_DEFAULT','COMPLETED','TERMINATED','CANCELLED']).parse(params.status) } : {}), ...(params.q ? { OR: [{ number: { contains: params.q, mode: 'insensitive' } }, { vehicleId: { contains: params.q, mode: 'insensitive' } }, { driver: { name: { contains: params.q, mode: 'insensitive' } } }] } : {}) }, orderBy: { number: params.sort === 'desc' ? 'desc' : 'asc' }, include: {
    vehicle: { select: { registration: true } }, driver: { select: { name: true } }, downtime: true,
    installments: { include: { allocations: { include: { payment: true } } }, orderBy: { sequence: 'asc' } },
    payments: { where: { date: { lt: range.until }, OR: [{ reversedAt: null }, { reversedAt: { gte: range.until } }] } },
    charges: { where: { date: { lt: range.until } }, include: { allocations: { include: { payment: true } } } },
    repairs: { where: { date: { gte: range.from, lt: range.until } } },
  } });
  const monthly = new Map<string, { label: string; expected: number; collected: number }>();
  const weekly = new Map<string, { label: string; expected: number; collected: number }>();
  const weekBucket = (date: Date) => { const monday = new Date(date); monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7); const key = monday.toISOString().slice(0, 10); if (!weekly.has(key)) weekly.set(key, { label: key, expected: 0, collected: 0 }); return weekly.get(key)!; };
  const bucket = (date: Date) => { const key = date.toISOString().slice(0, 7); if (!monthly.has(key)) monthly.set(key, { label: key, expected: 0, collected: 0 }); return monthly.get(key)!; };
  let overdue = 0; const expected: string[] = []; const balances: string[] = [];
  const allDueBalances: string[] = [];
  const rows = agreements.map(a => {
    const dates = dueDates(a.startDate, a.weeks, a.downtime, range.until);
    let outstanding = 0; let outstandingAmount = 0; let expectedAmount = 0;
    for (const installment of a.installments) {
      const date = dates[installment.sequence - 1]!;
      const asOfAllocations = installment.allocations.filter(v => v.payment.date < range.until && (!v.payment.reversedAt || v.payment.reversedAt >= range.until)).map(v => ({ ...v, payment: { reversedAt: null } }));
      const asOfBalance = installmentBalance(installment.amount, asOfAllocations);
      if (date < range.until) allDueBalances.push(asOfBalance.toString());
      if (date >= range.from && date < range.until) {
        expected.push(installment.amount.toString()); bucket(date).expected += installment.amount.toNumber();
        expectedAmount += installment.amount.toNumber(); weekBucket(date).expected += installment.amount.toNumber();
        const allocations = installment.allocations.filter(v => v.payment.date < range.until && (!v.payment.reversedAt || v.payment.reversedAt >= range.until));
        const balance = installmentBalance(installment.amount, allocations.map(v => ({ ...v, payment: { reversedAt: null } })));
        balances.push(balance.toString()); outstandingAmount += balance.toNumber(); if (balance.gt(0) && date < new Date()) { overdue++; outstanding++; }
      }
    }
    for (const charge of a.charges) {
      const allocations = charge.allocations.filter(v => v.payment.date < range.until && (!v.payment.reversedAt || v.payment.reversedAt >= range.until)).map(v => ({ ...v, payment: { reversedAt: null } }));
      allDueBalances.push(installmentBalance(charge.amount, allocations).toString());
    }
    if (a.activatedAt) {
      const upfront = sumMoney(a.payments.filter(p => p.kind === 'UPFRONT').map(p => p.amount));
      if (upfront.lt(a.upfrontRequired)) allDueBalances.push(a.upfrontRequired.minus(upfront).toString());
    }
    const periodPayments = a.payments.filter(p => p.date >= range.from);
    periodPayments.filter(p => p.kind === 'RENT').forEach(p => { bucket(p.date).collected += p.amount.toNumber(); weekBucket(p.date).collected += p.amount.toNumber(); });
    const completed = a.activatedAt ? dates.filter(d => d < range.until).length : 0;
    return { ...a, payments: periodPayments, completed, remaining: a.weeks - completed, progress: Math.floor(completed / a.weeks * 100), outstanding, outstandingAmount, expectedAmount, unavailable: a.downtime.some(d => d.startsAt < range.until && (!d.endsAt || d.endsAt >= range.until)) };
  });
  return { range, rows, chart: [...monthly.values()].sort((a, b) => a.label.localeCompare(b.label)), overdue,
    weeklyChart: [...weekly.values()].sort((a, b) => a.label.localeCompare(b.label)),
    expected: sumMoney(expected).toFixed(2), outstanding: sumMoney(balances).toFixed(2),
    collected: sumMoney(agreements.flatMap(a => a.payments.filter(p => p.kind === 'RENT' && p.date >= range.from).map(p => p.amount))).toFixed(2),
    totalOutstanding: sumMoney(allDueBalances).toFixed(2),
    currentWeeklyRent: sumMoney(rows.filter(r => ['ACTIVE','IN_DEFAULT'].includes(r.status) && !r.unavailable).map(r => r.weeklyAmount)).toFixed(2),
    repairs: sumMoney(agreements.flatMap(a => a.repairs.map(r => r.invoiceAmount))).toFixed(2),
    contributions: sumMoney(agreements.flatMap(a => a.repairs.map(r => r.driverAmount))).toFixed(2),
  };
}
