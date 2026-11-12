import { describe, expect, it } from 'vitest';
import { assertTransition, defaultWeeklyAmount, dueDates, installmentBalance, mileageCharge, repairSplit } from '@/lib/rto';
import { paymentSchema, agreementSchema } from '@/lib/schemas/rto.schema';
const date = (day: string) => new Date(day);
describe('RTO financial and chargeable-time rules', () => {
  it('uses year-dependent initial rates', () => { expect(defaultWeeklyAmount(2024)).toBe('2650.00'); expect(defaultWeeklyAmount(2025)).toBe('2850.00'); });
  it('creates exactly 234 weekly obligations across leap years', () => {
    const dates = dueDates(date('2024-02-26'), 234, []);
    expect(dates).toHaveLength(234); expect(dates[0]?.toISOString()).toBe('2024-03-04T00:00:00.000Z');
    expect(+dates[233]! - +date('2024-02-26')).toBe(234 * 7 * 86400000);
  });
  it('pauses partial days and includes downtime reached by an earlier extension', () => {
    const dates = dueDates(date('2026-01-01'), 2, [
      { startsAt: date('2026-01-07T12:00Z'), endsAt: date('2026-01-08T12:00Z') },
      { startsAt: date('2026-01-08T18:00Z'), endsAt: date('2026-01-09T06:00Z') },
    ]);
    expect(dates[0]?.toISOString()).toBe('2026-01-09T12:00:00.000Z');
    expect(dates[1]?.toISOString()).toBe('2026-01-16T12:00:00.000Z');
  });
  it('does not postpone an obligation already due when downtime begins', () => {
    expect(dueDates(date('2026-01-01'), 1, [{ startsAt: date('2026-01-08'), endsAt: date('2026-01-10') }])[0]?.toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });
  it('does not treat a partial or reversed payment as paid', () => {
    expect(installmentBalance('2650', [{ amount: '1000', payment: { reversedAt: null } }, { amount: '1650', payment: { reversedAt: new Date() } }]).toFixed(2)).toBe('1650.00');
  });
  it('shares net repair costs exactly, with rounding cent paid by company', () => {
    const result = repairSplit('100.01', '20'); expect(result.driver.toFixed(2)).toBe('40.00'); expect(result.company.toFixed(2)).toBe('40.01');
    expect(() => repairSplit('10', '11')).toThrow();
  });
  it('charges excess weekly mileage without carryover or guessing irregular periods', () => {
    expect(mileageCharge(2100, 7).amount.toFixed(2)).toBe('150.00'); expect(mileageCharge(1800, 7).amount.toFixed(2)).toBe('0.00');
    expect(() => mileageCharge(4000, 14)).toThrow(); expect(() => mileageCharge(-1, 7)).toThrow();
  });
  it('requires explicit permitted transitions and never reopens terminal agreements', () => {
    expect(() => assertTransition('ACTIVE', 'TERMINATED')).not.toThrow(); expect(() => assertTransition('DRAFT', 'COMPLETED')).toThrow(); expect(() => assertTransition('TERMINATED', 'ACTIVE')).toThrow();
  });
  it('rejects floating-point inputs, negative money, invalid dates and excess precision', () => {
    const input = { agreementId: 'test', date: '2026-01-01', amount: '1.00', kind: 'RENT', reference: 'one', method: 'EFT', idempotencyKey: 'dc699c45-9d5d-4e3e-872a-570106141889' };
    expect(paymentSchema.safeParse(input).success).toBe(true);
    for (const amount of ['-1', '1.001', 'NaN', 2.1]) expect(paymentSchema.safeParse({ ...input, amount }).success).toBe(false);
    expect(agreementSchema.safeParse({ number: 'one', vehicleId: 'CR01', driverId: 'one', modelYear: 2025, startDate: '2026-02-30', weeklyAmount: '2850' }).success).toBe(false);
  });
});
