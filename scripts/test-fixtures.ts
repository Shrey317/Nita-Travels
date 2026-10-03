import { PrismaClient } from '@prisma/client';
import { addDays, getISOWeek, getISOWeekYear, startOfISOWeek, subWeeks } from 'date-fns';
import { buildMileageEntry } from '../lib/mileage';

/** Synthetic fixtures are loaded only into an isolated schema by the guarded E2E launcher. */
export async function seedTestFixtures(prisma: PrismaClient) {
  const monday = startOfISOWeek(new Date());
  const baseline = subWeeks(monday, 8);
  await prisma.vehicle.createMany({ data: [
    { id: 'CR91', make: 'Suzuki', model: 'S-Presso', registration: 'TEST 091 GP', transmission: 'Manual', purchaseDate: baseline, purchasePriceCents: 15000000, mileageAtPurchaseKm: 50000, currentMileageKm: 69000, insurer: 'Fixture Insurance', policyNumber: 'TEST-POLICY-91', insuranceEndDate: addDays(monday, 15), monthlyPremiumCents: 75000, warranty: 'Fixture warranty: review original certificate', serviceIntervalKm: 10000 },
    { id: 'CR92', make: 'Volkswagen', model: 'Kombi', registration: 'TEST 092 GP', transmission: 'Auto', purchaseDate: baseline, purchasePriceCents: 24000000, mileageAtPurchaseKm: 100000, currentMileageKm: 109000, insuranceEndDate: addDays(monday, -5), serviceIntervalKm: 10000 },
    { id: 'CR93', make: 'Suzuki', model: 'S-Presso', registration: 'TEST 093 GP', transmission: 'Manual', purchaseDate: baseline, purchasePriceCents: 12000000, mileageAtPurchaseKm: 30000, currentMileageKm: 30000 },
    { id: 'CR94', make: 'Suzuki', model: 'S-Presso', registration: 'TEST 094 GP', transmission: 'Manual', purchaseDate: baseline, purchasePriceCents: 12000000, mileageAtPurchaseKm: 70000, currentMileageKm: 70000, active: false },
  ] });
  for (let week = 0; week < 8; week++) {
    const date = subWeeks(monday, 7 - week);
    await prisma.transaction.createMany({ data: [
      { vehicleId: 'CR91', date, category: 'Income', incomeZarCents: 240000 + week * 5000, notes: `Fixture rental week ${week + 1}` },
      { vehicleId: 'CR92', date, category: 'Income', incomeZarCents: 180000, notes: 'Fixture rental' },
      { vehicleId: 'CR91', date, category: 'Fuel', expenseZarCents: 40050 },
      { vehicleId: 'ALLCR', date, category: 'Other', expenseZarCents: 10025, notes: 'Fixture fleet administration' },
    ] });
    const previous = 50000 + week * 2300;
    await prisma.mileageEntry.create({ data: { vehicleId: 'CR91', date, currentMileageKm: previous + 2300, previousMileageKm: previous, ...buildMileageEntry(date, previous + 2300, previous) } });
  }
  await prisma.transaction.createMany({ data: [
    { vehicleId: 'CR91', date: subWeeks(monday, 5), category: 'BrakePads', expenseZarCents: 150000, notes: 'Fixture brake pads' },
    { vehicleId: 'CR91', date: subWeeks(monday, 1), category: 'BrakePads', expenseZarCents: 175000, notes: 'Fixture repeat brake pads' },
    { vehicleId: 'CR91', date: subWeeks(monday, 4), category: 'Service', expenseZarCents: 300000, mileageKm: 59000, notes: 'Fixture scheduled service' },
    { vehicleId: 'CR92', date: subWeeks(monday, 6), category: 'Service', expenseZarCents: 0, mileageKm: 99000, notes: 'Fixture warranty service' },
    { vehicleId: null, date: monday, category: 'Income', incomeZarCents: 10101, notes: 'Fixture unallocated income' },
    { vehicleId: 'CR94', date: monday, category: 'Income', incomeZarCents: 25000, notes: 'Fixture historical inactive income' },
    { vehicleId: 'CR91', date: monday, category: 'Income', incomeZarCents: 99999999, deletedAt: monday, notes: 'DELETED fixture excluded from totals' },
  ] });
  await prisma.vehicleNote.create({ data: { vehicleId: 'CR91', date: monday, note: 'Fixture inspection: review rear brakes before next shift.' } });
  await prisma.mileageEntry.create({ data: { vehicleId: 'CR92', date: subWeeks(monday, 2), previousMileageKm: 100000, currentMileageKm: 109000, distanceDrivenKm: 9000, weeklyLimitKm: 2000, overLimitByKm: 7000, isoWeek: getISOWeek(subWeeks(monday, 2)), isoYear: getISOWeekYear(monday) } });
}
