import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { createAgreement, createDriver, changeAgreementStatus, recordRtoPayment, reverseRtoPayment, recordDowntime, getRtoAgreement, recordRtoMileage, correctRtoMileage, adjustInstallment } from '@/lib/db/rto';
import { transferVehicle } from '@/lib/db/fleet-assignment';
import { createTransaction } from '@/lib/db/transactions';
import { createBankAgreement, recordBankPayment, recordBankStatement, getBankAgreement } from '@/lib/db/bank-finance';
import { correctDowntime, reconcileMileage, recordMeterReplacement } from '@/lib/db/rto-reconciliation';
import { closeDowntime, recordManualRtoRepair } from '@/lib/db/rto';
import { getFleetNotifications } from '@/lib/db/notifications';
import { approveRepair, createRepairQuotation, invoiceRepair, markRepairPaid } from '@/lib/db/rto-repairs';
import { completeRtoService, planRtoService } from '@/lib/db/rto-service';
import { createRtoVehicle } from '@/lib/db/rto-vehicles';
import { getVehiclesWithFinancials } from '@/lib/db/vehicles';
import { getServiceStatusAllVehicles } from '@/lib/db/service';
describe('separate fleet ledgers and atomic lifecycle', () => {
  it('creates vehicles directly in RTO and excludes them from normal operational lists', async () => {
    await createRtoVehicle({ id: 'RT90', make: 'Suzuki', model: 'S-Presso', registration: 'RTO-ONLY', transmission: 'Manual', purchaseDate: '2025-01-01', purchasePrice: '120000.50', mileageAtPurchaseKm: 100, currentMileageKm: 100 }, 'admin');
    expect((await prisma.vehicleAssignment.findFirstOrThrow({ where: { vehicleId: 'RT90' } })).module).toBe('RENT_TO_OWN');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'RT90' } })).purchasePriceCents).toBe(12000050);
    expect((await getVehiclesWithFinancials()).some(v => v.vehicle.id === 'RT90')).toBe(false);
    expect((await getServiceStatusAllVehicles()).some(v => v.vehicleId === 'RT90')).toBe(false);
  });
  let agreementId: string; let financeId: string;
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.vehicle.create({ data: { id: 'CR76', make: 'Suzuki', model: 'S-Presso', registration: 'TEST-RTO', transmission: 'Manual', purchaseDate: new Date('2025-01-01'), purchasePriceCents: 10000000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000, assignments: { create: { module: 'NORMAL_RENTAL', startsAt: new Date('2025-01-01') } } } });
    await createTransaction({ vehicleId: 'CR76', date: new Date('2025-01-05'), category: 'Income', incomeZarCents: 12345, expenseZarCents: 0, photoUrls: [] });
  });
  it('transfers without moving legacy records and rejects wrong-module rental writes', async () => {
    await transferVehicle({ vehicleId: 'CR76', toModule: 'RENT_TO_OWN', effectiveAt: '2025-02-01', odometerKm: 11000, condition: 'Inspected', resolution: 'Prior hire resolved' }, 'admin');
    expect(await prisma.transaction.count({ where: { vehicleId: 'CR76' } })).toBe(1);
    await expect(createTransaction({ vehicleId: 'CR76', date: new Date('2025-02-02'), category: 'Income', incomeZarCents: 100, expenseZarCents: 0, photoUrls: [] })).rejects.toThrow('another operating module');
    expect(await prisma.vehicleAssignment.count({ where: { vehicleId: 'CR76', endsAt: null } })).toBe(1);
  });
  it('validates activation and freezes a separate 234-week schedule', async () => {
    const driver = await createDriver({ name: 'Synthetic driver', phone: '000', licenceReference: 'TEST' }, 'admin');
    const agreement = await createAgreement({ number: 'TEST-RTO-76', vehicleId: 'CR76', driverId: driver.id, modelYear: 2025, startDate: '2025-02-01', weeklyAmount: '2850' }, 'admin'); agreementId = agreement.id;
    await expect(changeAgreementStatus({ agreementId, status: 'ACTIVE', reason: 'Approved' }, 'admin')).rejects.toThrow('signed contract');
    await prisma.rtoDocument.create({ data: { agreementId, title: 'Synthetic signed contract', kind: 'SIGNED_CONTRACT', mimeType: 'application/pdf', content: Buffer.from('%PDF-test'), actor: 'admin' } });
    await recordRtoPayment({ agreementId, date: '2025-02-01', amount: '8000', kind: 'UPFRONT', reference: 'upfront', method: 'EFT', idempotencyKey: randomUUID() }, 'admin');
    await changeAgreementStatus({ agreementId, status: 'ACTIVE', reason: 'Signed and reviewed' }, 'admin');
    expect(await prisma.rtoInstallment.count({ where: { agreementId } })).toBe(234);
    expect(await prisma.rtoPaymentAllocation.count()).toBe(0);
  });
  it('serializes duplicate payment retries and reverses without destroying history', async () => {
    const data = { agreementId, date: '2025-02-08', amount: '3000.01', kind: 'RENT', reference: 'rent-one', method: 'EFT', idempotencyKey: randomUUID() };
    const [a, b] = await Promise.all([recordRtoPayment(data, 'admin'), recordRtoPayment(data, 'admin')]); expect(a.id).toBe(b.id);
    const report = await getRtoAgreement(agreementId); expect(report.installments[0]?.balance).toBe('0.00'); expect(report.installments[1]?.balance).toBe('2699.99');
    await reverseRtoPayment({ paymentId: a.id, reason: 'Incorrect receipt' }, 'admin');
    expect((await getRtoAgreement(agreementId)).installments[0]?.balance).toBe('2850.00');
    expect(await prisma.rtoPaymentAllocation.count({ where: { paymentId: a.id } })).toBe(2);
    expect(await prisma.transaction.count({ where: { vehicleId: 'CR76' } })).toBe(1);
  });
  it('rejects overlapping downtime and active-agreement transfers atomically', async () => {
    await recordDowntime({ agreementId, startsAt: '2025-02-03T12:00:00Z', endsAt: '2025-02-04T00:00:00Z', reason: 'Unavailable' }, 'admin');
    await expect(recordDowntime({ agreementId, startsAt: '2025-02-03T18:00:00Z', reason: 'Duplicate' }, 'admin')).rejects.toThrow('overlaps');
    expect((await getRtoAgreement(agreementId)).installments[0]?.effectiveDueDate.toISOString()).toBe('2025-02-08T12:00:00.000Z');
    await expect(transferVehicle({ vehicleId: 'CR76', toModule: 'NORMAL_RENTAL', effectiveAt: '2025-03-01', odometerKm: 12000, condition: 'Good', resolution: 'Unresolved' }, 'admin')).rejects.toThrow('Resolve');
    expect((await prisma.vehicleAssignment.findFirstOrThrow({ where: { vehicleId: 'CR76', endsAt: null } })).module).toBe('RENT_TO_OWN');
  });
  it('tracks actual bank cash separately and never invents outstanding principal', async () => {
    financeId = (await createBankAgreement({ vehicleId: 'CR76', bank: 'Synthetic bank', reference: 'BANK-76', startDate: '2025-01-01', originalPrincipal: '100000', termMonths: 60, monthlyAmount: '2500', maturityDate: '2030-01-01' }, 'admin')).id;
    await recordBankPayment({ financeId, date: '2025-02-01', amount: '2500', principal: '1800', interest: '600', fees: '100', reference: 'bank-one', idempotencyKey: randomUUID() }, 'admin');
    let report = await getBankAgreement(financeId); expect(report.totalPaid).toBe('2500.00'); expect(report.knownPrincipalRepaid).toBe('1800.00'); expect(report.latestStatement).toBeNull();
    await recordBankStatement({ financeId, date: '2025-02-28', outstandingPrincipal: '98450', arrears: '0', fees: '0' }, 'admin');
    report = await getBankAgreement(financeId); expect(report.latestStatement?.outstandingPrincipal.toFixed(2)).toBe('98450.00');
    expect(await prisma.transaction.count({ where: { vehicleId: 'CR76' } })).toBe(1);
  });
  it('audits mileage corrections and obligation adjustments without mutating signed terms', async () => {
    await recordRtoMileage({ agreementId, date: '2025-02-01', odometerKm: 11000, source: 'Photo' }, 'admin');
    const entry = await recordRtoMileage({ agreementId, date: '2025-02-08', odometerKm: 13200, source: 'Photo' }, 'admin');
    await correctRtoMileage({ agreementId, entryId: entry.id, odometerKm: 13100, reason: 'Verified transcription error' }, 'admin');
    expect((await prisma.rtoCharge.findUniqueOrThrow({ where: { sourceKey: `mileage:${entry.id}` } })).amount.toFixed(2)).toBe('150.00');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR76' } })).currentMileageKm).toBe(13100);
    const installment = await prisma.rtoInstallment.findFirstOrThrow({ where: { agreementId }, orderBy: { sequence: 'asc' } });
    await adjustInstallment({ agreementId, installmentId: installment.id, revisedAmount: '2800', reason: 'Approved contractual adjustment' }, 'admin');
    expect((await prisma.rtoAgreement.findUniqueOrThrow({ where: { id: agreementId } })).weeklyAmount.toFixed(2)).toBe('2850.00');
    expect(await prisma.fleetAuditEvent.count({ where: { recordId: agreementId, action: 'MILEAGE_CORRECTED' } })).toBe(1);
    expect((await prisma.rtoMileagePeriod.findFirstOrThrow({ where: { agreementId } })).excessKm).toBe(100);
  });
  it('preserves lifetime mileage through a meter replacement and reconciles irregular weeks without rollover', async () => {
    const baseline = await prisma.rtoMileageEntry.findFirstOrThrow({ where: { agreementId }, orderBy: { date: 'desc' } });
    await recordMeterReplacement({ vehicleId: 'CR76', effectiveDate: '2025-02-09', lifetimeKm: 13150, displayedKm: 0, reason: 'Workshop replacement certificate' }, 'admin');
    const interim = await recordRtoMileage({ agreementId, date: '2025-02-12', odometerKm: 350, readingType: 'DISPLAYED', source: 'Verified photo' }, 'admin');
    expect(interim.odometerKm).toBe(13500); expect(interim.reviewRequired).toBe(true);
    const corrected = await correctRtoMileage({ agreementId, entryId: interim.id, odometerKm: 13510, reason: 'Corrected displayed meter transcription' }, 'admin');
    expect(corrected.displayedKm).toBe(360); expect(corrected.excessKm).toBe(0);
    expect(await prisma.rtoCharge.count({ where: { sourceKey: `mileage:${interim.id}` } })).toBe(0);
    const offBoundary = await recordRtoMileage({ agreementId, date: '2025-02-19', odometerKm: 2950, readingType: 'DISPLAYED', source: 'Verified photo' }, 'admin');
    expect(offBoundary.reviewRequired).toBe(true);
    const end = await recordRtoMileage({ agreementId, date: '2025-02-22', odometerKm: 4150, readingType: 'DISPLAYED', source: 'Verified photo' }, 'admin');
    const data = { agreementId, startEntryId: baseline.id, endEntryId: end.id, weeklyDistances: '1800,2400', evidence: 'Daily logs reconciled to photographed odometers' };
    await reconcileMileage(data, 'admin');
    await expect(correctRtoMileage({ agreementId, entryId: end.id, odometerKm: 17310, reason: 'Attempted change after weekly review' }, 'admin')).rejects.toThrow('reviewed weekly allocations');
    await expect(reconcileMileage(data, 'admin')).rejects.toThrow('already billed');
    const charge = await prisma.rtoCharge.findFirstOrThrow({ where: { agreementId, sourceKey: { startsWith: 'mileage-period:' } } }); expect(charge.amount.toFixed(2)).toBe('600.00');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR76' } })).currentMileageKm).toBe(17300);
  });
  it('reserves and releases a replacement and audits closed downtime corrections', async () => {
    await prisma.vehicle.create({ data: { id: 'CR75', make: 'Suzuki', model: 'S-Presso', registration: 'TEST-SPARE', transmission: 'Manual', purchaseDate: new Date('2025-01-01'), purchasePriceCents: 10000000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000, assignments: { create: { module: 'UNASSIGNED', startsAt: new Date('2025-01-01') } } } });
    const downtime = await recordDowntime({ agreementId, startsAt: '2025-03-01T00:00:00Z', replacementVehicleId: 'CR75', reason: 'Workshop repairs' }, 'admin');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR76' } })).availability).toBe('UNAVAILABLE');
    await expect(transferVehicle({ vehicleId: 'CR75', toModule: 'NORMAL_RENTAL', effectiveAt: '2025-03-02', odometerKm: 10000, condition: 'Good', resolution: 'Attempt to reserve twice' }, 'admin')).rejects.toThrow('replacement');
    await closeDowntime({ downtimeId: downtime.id, endsAt: '2025-03-03T00:00:00Z' }, 'admin');
    expect((await prisma.rtoDowntime.findUniqueOrThrow({ where: { id: downtime.id } })).replacementReturnedAt).not.toBeNull();
    await correctDowntime({ downtimeId: downtime.id, startsAt: '2025-03-01T12:00:00Z', endsAt: '2025-03-03T00:00:00Z', reason: 'Verified workshop intake time' }, 'admin');
    expect(await prisma.fleetAuditEvent.count({ where: { recordId: agreementId, action: 'DOWNTIME_CORRECTED' } })).toBe(1);
    const notifications = await getFleetNotifications();
    expect(notifications.some(n => n.id === `rto-service-${agreementId}`)).toBe(true);
    expect(notifications.some(n => n.id === 'mil-missing-CR76')).toBe(false);
  });
  it('approves a quotation before invoice, caps expenditure and charges the driver only once', async () => {
    const repair = await createRepairQuotation({ agreementId, date: '2025-03-04', kind: 'Tyres', description: 'Qualifying tyre repair', workshop: 'Synthetic workshop', quotation: '100.01' }, 'admin');
    expect(repair.status).toBe('QUOTED');
    expect(await prisma.rtoCharge.count({ where: { sourceKey: `repair:${repair.id}` } })).toBe(0);
    await approveRepair({ agreementId, repairId: repair.id, approvedAmount: '100.01', reason: 'Approved under signed 50/50 terms' }, 'admin');
    await expect(invoiceRepair({ agreementId, repairId: repair.id, date: '2025-03-05', invoiceAmount: '101', recoveryAmount: '20' }, 'admin')).rejects.toThrow('exceeds');
    await invoiceRepair({ agreementId, repairId: repair.id, date: '2025-03-05', invoiceAmount: '100.01', recoveryAmount: '20' }, 'admin');
    await expect(invoiceRepair({ agreementId, repairId: repair.id, date: '2025-03-05', invoiceAmount: '100.01', recoveryAmount: '20' }, 'admin')).rejects.toThrow('Approve');
    const paid = await markRepairPaid({ agreementId, repairId: repair.id, date: '2025-03-06', reference: 'company-repair-payment' }, 'admin');
    expect(paid.status).toBe('PAID'); expect(paid.companyAmount.toFixed(2)).toBe('40.01');
    const charges = await prisma.rtoCharge.findMany({ where: { sourceKey: `repair:${repair.id}` } }); expect(charges).toHaveLength(1); expect(charges[0]?.amount.toFixed(2)).toBe('40.00');
    expect(await prisma.transaction.count({ where: { vehicleId: 'CR76' } })).toBe(1);
  });
  it('keeps planned service mileage out of the physical odometer and charges the company on completion', async () => {
    const before = await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR76' } });
    const plan = await planRtoService({ agreementId, date: '2025-03-10', targetMileageKm: 30000, intervalKm: 15000, workshop: 'Synthetic workshop', description: 'Scheduled maintenance' }, 'admin');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR76' } })).currentMileageKm).toBe(before.currentMileageKm);
    const chargeCount = await prisma.rtoCharge.count({ where: { agreementId } });
    const service = await completeRtoService({ agreementId, serviceId: plan.id, date: '2025-03-10', odometerKm: 17800, cost: '1200' }, 'admin'); expect(service.status).toBe('COMPLETED');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR76' } })).currentMileageKm).toBe(17800);
    expect(await prisma.rtoCharge.count({ where: { agreementId } })).toBe(chargeCount);
  });
  it('records a manual repair expense without inventing a driver payment or quotation', async () => {
    const before = await prisma.rtoPayment.count({ where: { agreementId } });
    const repair = await recordManualRtoRepair({ agreementId, date: '2025-03-11', kind: 'Tyres', description: 'Manually entered paid invoice', workshop: 'Test workshop', invoiceAmount: '1000', recoveryAmount: '200' }, 'admin');
    expect(repair.quotation.toFixed(2)).toBe('0.00');
    expect(repair.driverAmount.toFixed(2)).toBe('400.00');
    expect(await prisma.rtoPayment.count({ where: { agreementId } })).toBe(before);
  });

});
