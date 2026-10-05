import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { createMileageEntry } from '@/lib/db/mileage';
import { updateVehicle } from '@/lib/db/vehicles';

describe('vehicle profile mileage integrity', () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.vehicle.create({ data: { id: 'CR87', make: 'Fixture', model: 'Mileage', registration: 'TEST 087', transmission: 'Manual', purchaseDate: new Date('2026-01-01'), purchasePriceCents: 1000000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000 } });
    await createMileageEntry({ vehicleId: 'CR87', date: new Date('2026-01-08'), currentMileageKm: 11000, photoUrls: [] });
    await createMileageEntry({ vehicleId: 'CR87', date: new Date('2026-01-15'), currentMileageKm: 12000, photoUrls: [] });
  });
  it('recalculates the first distance after a valid purchase-baseline correction', async () => {
    await updateVehicle('CR87', { mileageAtPurchaseKm: 10500 });
    const rows = await prisma.mileageEntry.findMany({ where: { vehicleId: 'CR87' }, orderBy: { date: 'asc' } });
    expect(rows[0]).toMatchObject({ previousMileageKm: 10500, distanceDrivenKm: 500 });
    expect(rows[1]).toMatchObject({ previousMileageKm: 11000, distanceDrivenKm: 1000 });
  });
  it('rolls back a baseline correction that would invalidate the first reading', async () => {
    await expect(updateVehicle('CR87', { mileageAtPurchaseKm: 11500 })).rejects.toThrow('preceding reading');
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR87' } })).mileageAtPurchaseKm).toBe(10500);
    expect((await prisma.mileageEntry.findFirstOrThrow({ where: { vehicleId: 'CR87' }, orderBy: { date: 'asc' } })).previousMileageKm).toBe(10500);
  });
  it('rejects an odometer below recorded mileage and preserves a higher manual reading', async () => {
    await expect(updateVehicle('CR87', { currentMileageKm: 11900 })).rejects.toThrow('recorded mileage');
    await updateVehicle('CR87', { currentMileageKm: 13000, mileageAtPurchaseKm: 10400 });
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id: 'CR87' } })).currentMileageKm).toBe(13000);
  });
});
