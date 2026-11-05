import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { changeRecord, decideChange } from '@/lib/changes';

const manager = { id: 'approval-manager', role: 'MANAGER' as const };
const admin = { id: 'admin', role: 'ADMIN' as const };
describe('atomic administrator approval', () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.vehicle.create({ data: { id: 'CR86', make: 'Fixture', model: 'Approval', registration: 'APPROVAL 086', transmission: 'Manual', purchaseDate: new Date('2026-01-01'), purchasePriceCents: 1000000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000 } });
  });
  it('queues manager edits without changing the vehicle, then applies an approved edit', async () => {
    const request = await changeRecord(manager, 'vehicle', 'CR86', 'UPDATE', { model: 'Approved model' });
    expect(request.pendingApproval).toBe(true);
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR86' } })).model).toBe('Approval');
    await expect(decideChange(manager, request.requestId!, true, '')).rejects.toThrow('Administrator');
    await decideChange(admin, request.requestId!, true, 'Verified');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR86' } })).model).toBe('Approved model');
    await expect(decideChange(admin, request.requestId!, true, '')).rejects.toThrow('already been reviewed');
  });
  it('rejects deactivation without changing the vehicle', async () => {
    const request = await changeRecord(manager, 'vehicle', 'CR86', 'DELETE');
    await decideChange(admin, request.requestId!, false, 'Keep active');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR86' } })).active).toBe(true);
  });
  it('refuses stale approvals and leaves them available for rejection', async () => {
    const request = await changeRecord(manager, 'vehicle', 'CR86', 'UPDATE', { model: 'Stale model' });
    await changeRecord(admin, 'vehicle', 'CR86', 'UPDATE', { model: 'Newer correction' });
    await expect(decideChange(admin, request.requestId!, true, '')).rejects.toThrow('record changed');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR86' } })).model).toBe('Newer correction');
    expect((await prisma.changeRequest.findUniqueOrThrow({ where: { id: request.requestId! } })).status).toBe('PENDING');
    await decideChange(admin, request.requestId!, false, 'Outdated');
  });
  it('allows exactly one concurrent review to apply', async () => {
    const request = await changeRecord(manager, 'vehicle', 'CR86', 'UPDATE', { model: 'Concurrent correction' });
    const outcomes = await Promise.allSettled([decideChange(admin, request.requestId!, true, ''), decideChange(admin, request.requestId!, true, '')]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR86' } })).model).toBe('Concurrent correction');
  });
});
