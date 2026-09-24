import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/db/client";
import { getWeeklyBreakdown } from "@/lib/db/weekly";
import { startOfISOWeek, endOfISOWeek, subWeeks } from "date-fns";

describe("Weekly Breakdown", () => {
  const vehicleId = "CR01";

  beforeEach(async () => {
    if (process.env.TEST_DB_APPROVED !== "true") {
      throw new Error("Safety Block: Test database operations are not approved");
    }
    // Clear transactions
    await prisma.transaction.deleteMany({});
    
    // Ensure test vehicle exists
    const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) {
      await prisma.vehicle.create({
        data: {
          id: vehicleId,
          make: "Toyota",
          model: "Corolla",
          registration: "TST-01",
          transmission: "Auto",
          purchaseDate: new Date("2024-01-01"),
          purchasePriceCents: 10000000,
          mileageAtPurchaseKm: 10000,
        }
      });
    }
  });

  afterEach(async () => {
    if (process.env.TEST_DB_APPROVED === "true") {
      await prisma.transaction.deleteMany({});
    }
  });

  it("should aggregate income and expenses correctly in the correct week", async () => {
    const now = new Date();
    const monday = startOfISOWeek(now);
    
    await prisma.transaction.createMany({
      data: [
        { vehicleId, category: "Income", date: monday, incomeZarCents: 5000, expenseZarCents: 0 },
        { vehicleId, category: "Fuel", date: monday, incomeZarCents: 0, expenseZarCents: 2000 },
        { vehicleId, category: "Repairs", date: monday, incomeZarCents: 0, expenseZarCents: 1500 },
      ]
    });

    const breakdown = await getWeeklyBreakdown(monday, endOfISOWeek(monday));
    expect(breakdown.length).toBe(1);
    
    const week = breakdown[0]!;
    expect(week.incomeCents).toBe(5000);
    expect(week.expenseCents).toBe(3500);
    expect(week.repairsCents).toBe(1500);
    expect(week.netProfitCents).toBe(1500);
    expect(week.hasData).toBe(true);
  });

  it("should handle empty weeks", async () => {
    const now = new Date();
    const monday = startOfISOWeek(now);
    const lastWeek = subWeeks(monday, 1);

    // Only transaction in last week
    await prisma.transaction.create({
      data: { vehicleId, category: "Income", date: lastWeek, incomeZarCents: 5000, expenseZarCents: 0 }
    });

    // Check from last week to this week
    const breakdown = await getWeeklyBreakdown(lastWeek, endOfISOWeek(monday));
    expect(breakdown.length).toBe(2);
    
    // First week should have data
    expect(breakdown[0]!.incomeCents).toBe(5000);
    expect(breakdown[0]!.hasData).toBe(true);

    // Second week should be empty
    expect(breakdown[1]!.incomeCents).toBe(0);
    expect(breakdown[1]!.expenseCents).toBe(0);
    expect(breakdown[1]!.hasData).toBe(false);
  });

  it("should correctly handle year boundaries", async () => {
    // Dec 30, 2024 is a Monday, which falls into ISO week 1 of 2025
    const boundaryDate = new Date("2024-12-30T12:00:00Z"); 
    
    await prisma.transaction.create({
      data: { vehicleId, category: "Income", date: boundaryDate, incomeZarCents: 10000, expenseZarCents: 0 }
    });

    const breakdown = await getWeeklyBreakdown(boundaryDate, boundaryDate);
    expect(breakdown.length).toBe(1);
    
    // ISO Year is 2025, Week 1
    expect(breakdown[0]!.isoYear).toBe(2025);
    expect(breakdown[0]!.weekNumber).toBe(1);
    expect(breakdown[0]!.weekKey).toBe("2025-W01");
    expect(breakdown[0]!.incomeCents).toBe(10000);
  });

  it("should default to full history if no bounds provided", async () => {
    await prisma.transaction.create({
      data: { vehicleId, category: "Income", date: new Date("2024-05-15"), incomeZarCents: 100, expenseZarCents: 0 }
    });
    await prisma.transaction.create({
      data: { vehicleId, category: "Income", date: new Date("2026-05-15"), incomeZarCents: 100, expenseZarCents: 0 }
    });

    const breakdown = await getWeeklyBreakdown();
    expect(breakdown.length).toBeGreaterThan(100); // 2024 to 2026 is ~156 weeks
    
    const week2024 = breakdown.find(b => b.hasData && b.isoYear === 2024);
    const week2026 = breakdown.find(b => b.hasData && b.isoYear === 2026);
    
    expect(week2024).toBeDefined();
    expect(week2026).toBeDefined();
  });
});
