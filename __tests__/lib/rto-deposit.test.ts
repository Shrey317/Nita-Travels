import { describe, expect, it } from 'vitest';
import { depositPaid, depositWeeks, depositSchedule, rentPart } from '@/lib/rto-deposit';
describe('weekly deposits', () => {
  it('collects 8000 over 13 weeks without charging extra', () => {
    const weeks = depositWeeks('8000', '0', 234);
    expect(weeks.slice(0,12).every(w => w.amount.eq(650))).toBe(true);
    expect(weeks[12]!.amount.toFixed(2)).toBe('200.00');
    expect(weeks.slice(13).every(w => w.amount.isZero())).toBe(true);
  });
  it('preserves deposits paid under the old system', () => {
    const paid = depositPaid([{ kind: 'UPFRONT', amount: '1000' }, { kind: 'WEEKLY', amount: '3500', depositAmount: '650' }]);
    expect(paid.toFixed(2)).toBe('1650.00');
    expect(depositWeeks('8000',paid,234)[2]!.balance.toFixed(2)).toBe('300.00');
    expect(depositWeeks('8000','8000',234).every(w=>w.balance.isZero())).toBe(true);
  });
  it('keeps deposits out of rent income and ignores reversed receipts', () => {
    expect(rentPart({ kind:'WEEKLY', amount:'3500', depositAmount:'650' }).toFixed(2)).toBe('2850.00');
    expect(depositPaid([{kind:'WEEKLY',amount:'3500',depositAmount:'650',reversedAt:new Date()}]).isZero()).toBe(true);
  });
  it('keeps the weekly top-up at 650 when an old partial deposit was already paid', () => {
    const plan = depositSchedule('8000', [{kind:'UPFRONT',amount:'1000'}],234);
    expect(plan[0]!.balance.toFixed(2)).toBe('650.00');
    expect(plan[10]!.balance.toFixed(2)).toBe('500.00');
    expect(plan.slice(11).every(w=>w.balance.isZero())).toBe(true);
  });

});
