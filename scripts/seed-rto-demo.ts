import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_TERMS, DAY, dueDates } from '../lib/rto';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
const actor = 'DEMO-SEED';
const today = new Date(new Date().toISOString().slice(0, 10));
const start = new Date(+today - 28 * DAY);

async function main() {
  // Read-only preflight. This script never applies migrations or changes real cars.
  await db.rtoAgreement.count();
  if (!process.argv.includes('--apply')) {
    console.log('Database ready. Use --apply to add three labelled demo cars.');
    return;
  }
  await db.$transaction(async tx => {
    for (const [index, scenario] of ['Paid up', 'Payment overdue', 'Draft setup'].entries()) {
      const n = index + 1;
      const vehicleId = `DEMO-RTO-0${n}`;
      const agreementId = `demo-rto-agreement-${n}`;
      if (await tx.rtoAgreement.findUnique({ where: { id: agreementId } })) continue;
      const weeklyAmount = index === 1 ? '2650.00' : '2850.00';
      await tx.vehicle.create({ data: {
        id: vehicleId, make: 'Suzuki', model: 'S-Presso', registration: `DEMO-0${n}`,
        transmission: 'Manual', purchaseDate: start, purchasePriceCents: 0,
        mileageAtPurchaseKm: 10000, currentMileageKm: index === 2 ? 10000 : 17200,
        assignments: { create: { module: 'RENT_TO_OWN', startsAt: start } },
      } });
      const driver = await tx.rtoDriver.create({ data: { id: `demo-rto-driver-${n}`, name: `DEMO Driver ${n} (${scenario})`, phone: '0000000000', licenceReference: `DEMO-NOT-VALID-${n}` } });
      await tx.rtoAgreement.create({ data: {
        id: agreementId, number: `DEMO-RTO-0${n}`, vehicleId, driverId: driver.id,
        modelYear: index === 1 ? 2024 : 2025, startDate: start, weeklyAmount,
        status: index === 2 ? 'DRAFT' : index === 1 ? 'IN_DEFAULT' : 'ACTIVE',
        activatedAt: index === 2 ? null : start, terms: { ...DEFAULT_TERMS, demo: true },
      } });
      if (index !== 2) {
        // Synthetic fixtures, deliberately no forged signed contract.
        const dates = dueDates(start, 234, []);
        await tx.rtoInstallment.createMany({ data: dates.map((date, i) => ({ id: `${agreementId}-week-${i + 1}`, agreementId, sequence: i + 1, originalDueDate: date, effectiveDueDate: date, amount: weeklyAmount })) });
        await tx.rtoPayment.create({ data: { agreementId, date: start, amount: '8000', kind: 'UPFRONT', reference: `${vehicleId}-UPFRONT`, method: 'DEMO', notes: 'Fictional demonstration payment; no money received.', idempotencyKey: `${agreementId}-upfront`, actor } });
        for (let week = 1; week <= (index === 0 ? 4 : 2); week++) {
          await tx.rtoPayment.create({ data: { agreementId, date: dates[week - 1]!, amount: weeklyAmount, kind: 'RENT', reference: `${vehicleId}-W${week}`, method: 'DEMO', notes: 'Fictional demonstration payment; no money received.', idempotencyKey: `${agreementId}-payment-${week}`, actor, allocations: { create: { installmentId: `${agreementId}-week-${week}`, amount: weeklyAmount } } } });
        }
        for (let week = 0; week <= 4; week++) {
          const date = new Date(+start + week * 7 * DAY);
          await tx.rtoMileageEntry.create({ data: { agreementId, date, odometerKm: 10000 + week * 1800, distanceKm: week ? 1800 : 0, excessKm: 0, source: 'DEMO synthetic odometer reading' } });
          if (week) await tx.rtoMileagePeriod.create({ data: { agreementId, startsAt: new Date(+date - 7 * DAY), endsAt: date, distanceKm: 1800, excessKm: 0, evidence: 'DEMO synthetic weekly distance', actor } });
        }
      }
      await tx.fleetAuditEvent.create({ data: { scope: 'RTO', recordId: agreementId, action: 'DEMO_CREATED', actor, detail: { scenario, fictional: true, vehicleId } } });
    }
  }, { timeout: 60000 });
  console.log(JSON.stringify(await db.rtoAgreement.findMany({ where: { id: { startsWith: 'demo-rto-agreement-' } }, select: { number: true, status: true, vehicleId: true } })));
}
main().catch(error => {
  console.error('Demo seed failed. No credentials shown.', error.code ?? error.name);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
