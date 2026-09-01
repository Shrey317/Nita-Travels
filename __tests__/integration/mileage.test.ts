import { describe, it, expect, beforeAll } from "vitest";
import { verifyTestEnvironment } from "@/lib/db/safety";
import { prisma } from "@/lib/db/client";
import { createMileageEntry, updateMileageEntry, deleteMileageEntry } from "@/lib/db/mileage";
import { startOfWeek } from "date-fns";

describe("Mileage Integration Tests", () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true); // Require destructive permissions
  });

  it("handles mileage creation, middle-entry edits, deletions, and cascading recalculations", async () => {
    // 1. Setup mock vehicle
    const vehicleId = "CR88";
    await prisma.vehicle.upsert({
      where: { id: vehicleId },
      update: { active: true, currentMileageKm: 100000 },
      create: {
        id: vehicleId,
        make: "Test",
        model: "Car",
        registration: "TEST 123",
        transmission: "Manual",
        purchaseDate: new Date("2026-01-01"),
        purchasePriceCents: 10000000,
        mileageAtPurchaseKm: 90000,
        currentMileageKm: 100000,
        active: true,
      }
    });

    // Clear old mileage entries
    await prisma.mileageEntry.deleteMany({ where: { vehicleId } });

    // 2. Create mileage entries
    // Entry 1 (First)
    const e1 = await createMileageEntry({ vehicleId, currentMileageKm: 102000, date: new Date("2026-07-01"), photoUrls: [] });
    expect(e1.distanceDrivenKm).toBe(2000);
    expect(e1.previousMileageKm).toBe(100000);

    // Entry 2 (Middle)
    const e2 = await createMileageEntry({ vehicleId, currentMileageKm: 104000, date: new Date("2026-07-08"), photoUrls: [] });
    expect(e2.distanceDrivenKm).toBe(2000);
    expect(e2.previousMileageKm).toBe(102000);

    // Entry 3 (Latest)
    const e3 = await createMileageEntry({ vehicleId, currentMileageKm: 105000, date: new Date("2026-07-15"), photoUrls: [] });
    expect(e3.distanceDrivenKm).toBe(1000);
    expect(e3.previousMileageKm).toBe(104000);

    // Verify Vehicle current mileage updated
    let v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(v?.currentMileageKm).toBe(105000);

    // 3. Edit middle entry (decrease current mileage from 104000 to 103000)
    await updateMileageEntry(e2.id, { currentMileageKm: 103000 });
    
    // Verify cascading recalculation on e3
    const updatedE3 = await prisma.mileageEntry.findUnique({ where: { id: e3.id } });
    expect(updatedE3?.previousMileageKm).toBe(103000); // e3's prev is now e2's new current
    expect(updatedE3?.distanceDrivenKm).toBe(2000); // 105000 - 103000

    // 4. Delete middle entry (e2)
    await deleteMileageEntry(e2.id);

    // Verify cascading recalculation on e3 again
    const finalE3 = await prisma.mileageEntry.findUnique({ where: { id: e3.id } });
    expect(finalE3?.previousMileageKm).toBe(102000); // e3's prev is now e1's current
    expect(finalE3?.distanceDrivenKm).toBe(3000); // 105000 - 102000

    // 5. Delete first entry (e1)
    await deleteMileageEntry(e1.id);
    const veryFinalE3 = await prisma.mileageEntry.findUnique({ where: { id: e3.id } });
    expect(veryFinalE3?.previousMileageKm).toBe(102000); // e3's prev remains 102000 because it is now the anchor

    // Delete latest
    await deleteMileageEntry(e3.id);
    v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(v?.currentMileageKm).toBe(90000); // Reset to base (mileageAtPurchaseKm)
  }, 60000);

  it("rejects mileage creation for deactivated vehicles", async () => {
    const inactiveId = "CR99";
    await prisma.vehicle.upsert({
      where: { id: inactiveId },
      update: { active: false, deletedAt: new Date(), currentMileageKm: 100000 },
      create: {
        id: inactiveId,
        make: "Test",
        model: "Car",
        registration: "TEST 123",
        transmission: "Manual",
        purchaseDate: new Date("2026-01-01"),
        purchasePriceCents: 10000000,
        mileageAtPurchaseKm: 90000,
        currentMileageKm: 100000,
        active: false,
        deletedAt: new Date()
      }
    });

    await expect(createMileageEntry({ vehicleId: inactiveId, currentMileageKm: 102000, date: new Date(), photoUrls: [] })).rejects.toThrow(/Cannot add mileage/i);
  });
});
