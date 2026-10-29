import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { getVehicleTimeline } from '@/lib/db/vehicles';
import { updateTransaction } from '@/lib/db/transactions';

describe('database pagination and concurrent partial edits', () => {
  it('preserves both concurrent changes and paginates same-date fleet notes deterministically', async () => {
    await prisma.vehicle.create({ data: { id: 'CR86', make: 'Test', model: 'Timeline', registration: 'SYNTHETIC', transmission: 'Manual', purchaseDate: new Date('2025-01-01'), purchasePriceCents: 100000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000 } });
    const row = await prisma.transaction.create({ data: { vehicleId: 'CR86', date: new Date('2026-01-01'), category: 'Income', incomeZarCents: 12345 } });
    await Promise.all([updateTransaction(row.id, { notes: 'Retained correction' }), updateTransaction(row.id, { incomeZarCents: 23456 })]);
    expect(await prisma.transaction.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ notes: 'Retained correction', incomeZarCents: 23456 });
    await prisma.vehicleNote.create({ data: { vehicleId: 'ALLCR', date: row.date, note: 'Fleet note' } });
    const first = await getVehicleTimeline('CR86', { page: 1, limit: 1 });
    const second = await getVehicleTimeline('CR86', { page: 2, limit: 1 });
    expect(first.total).toBe(2);
    expect(second.total).toBe(2);
    expect(first.items[0]?.id).not.toBe(second.items[0]?.id);
    expect((await getVehicleTimeline('CR86', { type: 'notes' })).items[0]?.details).toBe('Fleet note');
    expect((await getVehicleTimeline('CR86', { page: 9, limit: 1 })).total).toBe(2);
  });
});
