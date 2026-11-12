import { expect, it } from 'vitest';
import { bankSchedule } from '@/lib/bank-schedule';
it('retains month-end due days, applies actual cash oldest first and ignores reversed cash', () => {
  const rows = bankSchedule(new Date('2024-01-31'), 3, '100', [{ date: new Date('2024-02-01'), amount: '150', reversedAt: null }, { date: new Date('2024-02-02'), amount: '100', reversedAt: new Date('2024-02-03') }], new Date('2024-03-01'))!;
  expect(rows.map(r => r.date.toISOString().slice(0,10))).toEqual(['2024-01-31','2024-02-29','2024-03-31']);
  expect(rows.map(r => r.balance.toFixed(2))).toEqual(['0.00','50.00','100.00']);
  expect(bankSchedule(null, 60, '2500', [])).toBeNull();
});
it('supports weekly, fortnightly and quarterly schedules bounded by maturity', () => {
  const first = new Date('2026-01-01'); const end = new Date('2026-02-01');
  expect(bankSchedule(first, 1, '100', [], first, 'WEEKLY', end)?.map(r => r.date.toISOString().slice(0,10))).toEqual(['2026-01-01','2026-01-08','2026-01-15','2026-01-22','2026-01-29']);
  expect(bankSchedule(first, 1, '100', [], first, 'FORTNIGHTLY', end)).toHaveLength(3);
  expect(bankSchedule(new Date('2026-01-31'), 6, '100', [], first, 'QUARTERLY', new Date('2026-07-01'))?.map(r => r.date.toISOString().slice(0,10))).toEqual(['2026-01-31','2026-04-30']);
});
