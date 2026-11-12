import { expect, it } from 'vitest';
import { omitFinanceInputs, redactLegacyFinance } from '@/lib/private-finance';
it('redacts nested legacy finance fields while preserving ordinary vehicle data and dates', () => {
  const date = new Date('2026-01-01');
  const input = { vehicle: { id: 'CR01', financeBank: 'Private bank', financePolicyNumber: 'secret', targetEmiCents: 450000, emiMonthsTotal: 60, emiMonthsPaid: 10, purchasePriceCents: 10000000, purchaseDate: date }, snapshots: [{ before: { financePolicyNumber: 'secret' } }] };
  const result = redactLegacyFinance(input);
  expect(result.vehicle.financeBank).toBeNull(); expect(result.vehicle.targetEmiCents).toBe(0); expect(result.vehicle.purchasePriceCents).toBe(10000000); expect(result.vehicle.purchaseDate).toBe(date);
  expect(JSON.stringify(result)).not.toContain('secret'); expect(input.vehicle.financeBank).toBe('Private bank');
});
it('omits private finance keys from operational staff edits', () => {
  expect(omitFinanceInputs({ registration: 'NEW', purchaseType: 'Financed', financeBank: null, targetEmiCents: 0 })).toEqual({ registration: 'NEW' });
});
