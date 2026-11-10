import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { changeRecord, decideChange } from '@/lib/changes';
import { validateWorkOrderExpense } from '@/lib/work-order-validation';
const manager = { id: 'fixture-manager', role: 'MANAGER' as const };
const admin = { id: 'admin', role: 'ADMIN' as const };
describe('document and work order approvals', () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.vehicle.create({ data: { id: 'CR85', make: 'Fixture', model: 'Operations', registration: 'OPS 085', transmission: 'Manual', purchaseDate: new Date('2026-01-01'), purchasePriceCents: 10000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000 } });
  });
  it('keeps document expiry unchanged until approval and archives without deleting history', async () => {
    const document = await prisma.fleetDocument.create({ data: { vehicleId: 'CR85', title: 'Licence', documentType: 'Licence', expiryDate: new Date('2026-12-01') } });
    const input = { vehicleId: 'CR85', title: 'Licence renewed', documentType: 'Licence', expiryDate: '2027-12-01', photoUrls: [] };
    const request = await changeRecord(manager, 'document', document.id, 'UPDATE', input);
    expect((await prisma.fleetDocument.findUniqueOrThrow({ where: { id: document.id } })).title).toBe('Licence');
    await decideChange(admin, request.requestId!, true, '');
    expect((await prisma.fleetDocument.findUniqueOrThrow({ where: { id: document.id } })).expiryDate).toEqual(new Date('2027-12-01'));
    await changeRecord(admin, 'document', document.id, 'DELETE');
    expect((await prisma.fleetDocument.findUniqueOrThrow({ where: { id: document.id } })).archived).toBe(true);
  });
  it('requires approval for completion and links costs without creating another transaction', async () => {
    const expense = await prisma.transaction.create({ data: { vehicleId: 'CR85', date: new Date('2026-11-01'), category: 'Repairs', expenseZarCents: 50000 } });
    const work = await prisma.workOrder.create({ data: { vehicleId: 'CR85', kind: 'REPAIR', title: 'Repair', plannedDate: new Date('2026-11-01') } });
    const before = await prisma.transaction.count();
    const request = await changeRecord(manager, 'workOrder', work.id, 'UPDATE', { vehicleId: 'CR85', kind: 'REPAIR', title: 'Repair', plannedDate: '2026-11-01', startedDate: '2026-11-02', completedDate: '2026-11-05', workshop: 'Fixture workshop', expenseTransactionId: expense.id });
    expect((await prisma.workOrder.findUniqueOrThrow({ where: { id: work.id } })).completedDate).toBeNull();
    await decideChange(admin, request.requestId!, true, '');
    expect((await prisma.workOrder.findUniqueOrThrow({ where: { id: work.id } })).expenseTransactionId).toBe(expense.id);
    expect(await prisma.transaction.count()).toBe(before);
    await expect(prisma.$transaction(tx => validateWorkOrderExpense(tx, 'CR99', expense.id))).rejects.toThrow('this vehicle');
  });
});
