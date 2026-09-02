import { describe, it, expect, beforeAll } from "vitest";
import { verifyTestEnvironment } from "@/lib/db/safety";
import { prisma } from "@/lib/db/client";
import { getVehicleDetail } from "@/lib/db/vehicles";
import { calculateVehicleHealthScore } from "@/lib/health";

describe("Health Score Integration Tests", () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true); // Require destructive permissions
  });

  it("calculates 12-month repair cost accurately vs fleet average and totals exactly 100%", async () => {
    const v1 = "TEST-HLT-01";
    const v2 = "TEST-HLT-02";

    // Clean up
    await prisma.transaction.deleteMany({ where: { vehicleId: { in: [v1, v2] } } });
    await prisma.vehicle.deleteMany({ where: { id: { in: [v1, v2] } } });

    await prisma.vehicle.create({
      data: {
        id: v1, make: "Test", model: "Car", registration: "HLT123", transmission: "Manual",
        purchaseDate: new Date("2026-01-01"), purchasePriceCents: 10000000, mileageAtPurchaseKm: 90000,
        currentMileageKm: 100000, active: true,
      }
    });

    await prisma.vehicle.create({
      data: {
        id: v2, make: "Test", model: "Car", registration: "HLT456", transmission: "Manual",
        purchaseDate: new Date("2026-01-01"), purchasePriceCents: 10000000, mileageAtPurchaseKm: 90000,
        currentMileageKm: 100000, active: true,
      }
    });

    // Create 12-month repair data
    // Fleet total active vehicles: At least 2 (v1, v2).
    // Let's give v1 high repair costs (R10,000) and v2 low repair costs (R1,000).
    const today = new Date();
    await prisma.transaction.create({
      data: {
        date: today,
        vehicleId: v1,
        category: "Repairs",
        expenseZarCents: 1000000, // R10,000
      }
    });

    await prisma.transaction.create({
      data: {
        date: today,
        vehicleId: v2,
        category: "Repairs",
        expenseZarCents: 100000, // R1,000
      }
    });

    const v1Detail = await getVehicleDetail(v1);
    const v2Detail = await getVehicleDetail(v2);

    expect(v1Detail).toBeDefined();
    expect(v2Detail).toBeDefined();

    // The logic: fleet average = total repairs over 12 months / total active vehicles
    // Total active vehicles = 2 (v1, v2) (since we cleared DB for this test)
    // Wait, since we are using a shared test DB, other tests might have added vehicles.
    // To be deterministic, we calculate the exact fleet average manually:
    const activeVehicles = await prisma.vehicle.findMany({ where: { active: true }, select: { id: true } });
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const allRepairs = await prisma.transaction.aggregate({
      where: {
        category: "Repairs",
        date: { gte: oneYearAgo },
        vehicleId: { in: activeVehicles.map(v => v.id) }
      },
      _sum: {
        expenseZarCents: true
      }
    });

    const totalRepairCents = allRepairs._sum?.expenseZarCents || 0;
    const fleetAverage = activeVehicles.length > 0 ? totalRepairCents / activeVehicles.length : 0;
    
    // v1 repairs = 1000000. Check if it's > 2x fleetAvg
    const v1HighRepairCostExpected = 1000000 > fleetAverage * 2;
    // v2 repairs = 100000. Check if it's > 2x fleetAvg
    const v2HighRepairCostExpected = 100000 > fleetAverage * 2;
    
    expect(v1Detail!.highRepairCost).toBe(v1HighRepairCostExpected);
    expect(v2Detail!.highRepairCost).toBe(v2HighRepairCostExpected);
    
    // Evaluate the pure logic
    const health1 = calculateVehicleHealthScore({
      active: true,
      serviceStatus: "OK",
      insuranceEndDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // > 14 days
      hasRecentMileage: true,
      highRepairFrequency: false,
      highRepairCost: v1Detail!.highRepairCost,
      roiPercent: 10,
    });

    // Verify it totals exactly 100%. The deduction logic subtracts from 100.
    // Base score is 100.
    // Categories max: Service 20, Insurance 15, Mileage 15, Repairs 25, Financial 25. Total: 100.
    let totalMax = health1.categories.service.max + health1.categories.insurance.max + health1.categories.mileage.max + health1.categories.repairs.max + health1.categories.financial.max;
    expect(totalMax).toBe(100);

    // Assert downtime is nowhere to be found
    const categoriesRecord = health1.categories as Record<string, unknown>;
    expect(categoriesRecord.downtime).toBeUndefined();
  }, 20000);
});
