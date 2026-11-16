import { describe, it, expect } from 'vitest';
import { paymentSummary, depositProgress } from '@/lib/rto-summary';
describe('RTO collection summary', () => {
  it('keeps overdue, today and later this week separate at the business date boundary', () => {
    const items = [
      {date:new Date('2026-11-15'),amount:'3500.00'},
      {date:new Date('2026-11-16T12:00:00Z'),amount:'3500.00'},
      {date:new Date('2026-11-22'),amount:'3050.00'},
      {date:new Date('2026-11-23'),amount:'2850.00'},
    ];
    expect(paymentSummary(items,new Date('2026-11-16'))).toEqual({overdue:'3500.00',dueToday:'3500.00',laterThisWeek:'3050.00',totalDue:'7000.00'});
  });
  it('caps the last deposit contribution and stops at zero', () => {
    expect(depositProgress('8000')).toEqual({payments:13,finalPayment:'200.00'});
    expect(depositProgress('650')).toEqual({payments:1,finalPayment:'650.00'});
    expect(depositProgress('0')).toEqual({payments:0,finalPayment:'0.00'});
  });
});
