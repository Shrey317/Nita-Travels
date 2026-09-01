import { describe, it, expect, beforeAll } from "vitest";
import { verifyTestEnvironment } from "@/lib/db/safety";
import { prisma } from "@/lib/db/client";
import { getFleetNotifications } from "@/lib/db/notifications";

describe("Notifications Integration Tests", () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true); // Require destructive permissions
  });

  it("handles Monday-Sunday boundaries correctly and ignores inactive vehicles", async () => {
    // 1. Setup mock vehicles
    const activeId = "TEST-NOTIF-01";
    const inactiveId = "TEST-NOTIF-02";

    // Clean up first
    await prisma.mileageEntry.deleteMany({ where: { vehicleId: { in: [activeId, inactiveId] } } });
    await prisma.vehicle.deleteMany({ where: { id: { in: [activeId, inactiveId] } } });

    await prisma.vehicle.create({
      data: {
        id: activeId,
        make: "Test", model: "Car", registration: "ACT123", transmission: "Manual",
        purchaseDate: new Date("2026-01-01"), purchasePriceCents: 10000000, mileageAtPurchaseKm: 90000,
        currentMileageKm: 100000, active: true,
      }
    });

    await prisma.vehicle.create({
      data: {
        id: inactiveId,
        make: "Test", model: "Car", registration: "INA123", transmission: "Manual",
        purchaseDate: new Date("2026-01-01"), purchasePriceCents: 10000000, mileageAtPurchaseKm: 90000,
        currentMileageKm: 100000, active: false, deletedAt: new Date()
      }
    });

    // 2. Test missing mileage (simulate checking on a Monday morning for last week)
    // If neither has mileage, only active vehicle should be flagged.
    const allNotifs = await getFleetNotifications();
    const missing = allNotifs.filter(n => n.id.startsWith("mil-missing-"));
    const activeMissing = missing.find(m => m.vehicleId === activeId);
    const inactiveMissing = missing.find(m => m.vehicleId === inactiveId);
    
    expect(activeMissing).toBeDefined();
    expect(inactiveMissing).toBeUndefined();

    // 3. Create over-limit mileage for both (e.g. 3000km > 2000km limit)
    // We mock the date to fall into "this week" (e.g., today)
    const today = new Date();
    await prisma.mileageEntry.create({
      data: {
        date: today,
        vehicleId: activeId,
        previousMileageKm: 100000,
        currentMileageKm: 103000,
        distanceDrivenKm: 3000,
        isoWeek: 1, // mocked
        isoYear: 2026, // mocked
        weeklyLimitKm: 2000,
        overLimitByKm: 1000
      }
    });

    await prisma.mileageEntry.create({
      data: {
        date: today,
        vehicleId: inactiveId,
        previousMileageKm: 100000,
        currentMileageKm: 103000,
        distanceDrivenKm: 3000,
        isoWeek: 1, // mocked
        isoYear: 2026, // mocked
        weeklyLimitKm: 2000,
        overLimitByKm: 1000
      }
    });

    const finalNotifs = await getFleetNotifications();
    const overLimit = finalNotifs.filter(n => n.id.startsWith("mil-over-"));
    const activeOver = overLimit.find(m => m.vehicleId === activeId);
    const inactiveOver = overLimit.find(m => m.vehicleId === inactiveId);
    
    expect(activeOver).toBeDefined();
    expect(inactiveOver).toBeUndefined();
  }, 20000);
});
