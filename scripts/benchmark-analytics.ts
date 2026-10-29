/** Synthetic, read-only measurement. Does not load environment files or access a database. */
import { performance } from 'node:perf_hooks';
import { buildPeriodAnalysis, type AnalyticsVehicle, type AnalyticsTransaction } from '../lib/analytics';

const vehicles: AnalyticsVehicle[] = Array.from({ length: 99 }, (_, i) => ({ id: `CR${String(i + 1).padStart(2, '0')}`, registration: 'SYNTHETIC', active: true, purchasePriceCents: 10000000, purchaseDate: new Date('2020-01-01'), currentMileageKm: 10000, mileageAtPurchaseKm: 10000, insurer: 'Fixture', policyNumber: 'Fixture', insuranceEndDate: new Date('2027-01-01'), warranty: 'No warranty' }));
for (const count of [1000, 100000]) {
  const transactions: AnalyticsTransaction[] = Array.from({ length: count }, (_, i) => ({ id: `synthetic-${i}`, date: new Date(Date.UTC(2020 + i % 6, i % 12, 1)), vehicleId: vehicles[i % 99]!.id, category: i % 2 ? 'Income' : 'Fuel', incomeZarCents: i % 2 ? 10001 : 0, expenseZarCents: i % 2 ? 0 : 501 }));
  const timings: number[] = [];
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    const report = buildPeriodAnalysis({ transactions, vehicles, mileage: [], range: { from: new Date('2020-01-01'), to: new Date('2025-12-31') } });
    if (report.totals.transactionCount !== count || report.totals.incomeCents !== count / 2 * 10001 || report.totals.expenseCents !== count / 2 * 501) throw new Error('Synthetic reconciliation failed');
    timings.push(performance.now() - start);
  }
  console.log(JSON.stringify({ records: count, vehicles: vehicles.length, runs: timings.length, minMs: Math.round(Math.min(...timings)), maxMs: Math.round(Math.max(...timings)), meanMs: Math.round(timings.reduce((a, b) => a + b) / timings.length) }));
}
