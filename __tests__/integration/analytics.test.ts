import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/client";
import { verifyTestEnvironment } from "@/lib/db/safety";
import { getAnalyticsReport } from "@/lib/db/analytics";
import { getFleetTotals, createTransaction, deleteTransaction } from "@/lib/db/transactions";
import { getWeeklyBreakdown } from "@/lib/db/weekly";
import { getMonthlyBreakdown } from "@/lib/db/monthly";
import { getVehicleDetail, deactivateVehicle } from "@/lib/db/vehicles";

describe("real database financial reconciliation", () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.vehicle.create({ data: { id: "CR81", make: "Test", model: "Ledger", registration: "TEST 081", transmission: "Manual", purchaseDate: new Date("2024-01-01"), purchasePriceCents: 1000000, mileageAtPurchaseKm: 10000, currentMileageKm: 11000 } });
    await prisma.transaction.createMany({ data: [
      { vehicleId: "CR81", date: new Date("2025-01-01"), category: "Income", incomeZarCents: 100001 },
      { vehicleId: "CR81", date: new Date("2025-01-31"), category: "Repairs", expenseZarCents: 10001 },
      { vehicleId: "ALLCR", date: new Date("2025-01-02"), category: "Other", expenseZarCents: 333 },
      { vehicleId: null, date: new Date("2025-01-03"), category: "Income", incomeZarCents: 222 },
      { vehicleId: "CR81", date: new Date("2024-12-30"), category: "Income", incomeZarCents: 50000 },
      { vehicleId: "CR81", date: new Date("2025-01-20"), category: "Income", incomeZarCents: 999999, deletedAt: new Date("2025-01-21") },
    ] });
  });
  it("matches source ledger, dashboard helper, analytics, weekly and monthly on identical bounds", async () => {
    const from = new Date("2025-01-01"), to = new Date("2025-01-31");
    const [report, fleet, weekly, monthly, source] = await Promise.all([
      getAnalyticsReport({ range: "custom", dateFrom: "2025-01-01", dateTo: "2025-01-31" }),
      getFleetTotals(from, to), getWeeklyBreakdown(from, to), getMonthlyBreakdown(2025, { from, to }),
      prisma.transaction.aggregate({ where: { date: { gte: from, lte: to }, deletedAt: null }, _sum: { incomeZarCents: true, expenseZarCents: true } }),
    ]);
    expect(report.current.totals.incomeCents).toBe(source._sum.incomeZarCents);
    expect(report.current.totals.expenseCents).toBe(source._sum.expenseZarCents);
    expect(fleet.incomeCents).toBe(100223);
    expect(report.current.totals.netProfitCents).toBe(fleet.netProfitCents);
    for (const rows of [weekly, monthly]) {
      expect(rows.reduce((sum, row) => sum + row.incomeCents, 0)).toBe(fleet.incomeCents);
      expect(rows.reduce((sum, row) => sum + row.expenseCents, 0)).toBe(fleet.expenseCents);
    }
    expect(report.current.unallocated.incomeCents).toBe(222);
    expect(report.current.unallocated.expenseCents).toBe(333);
  });
  it("filters an individual vehicle and reflects mutation/deletion without stale cache", async () => {
    const params = { range: "custom", dateFrom: "2025-01-01", dateTo: "2025-01-31", vehicleId: "CR81" };
    const before = await getAnalyticsReport(params);
    const row = await createTransaction({ vehicleId: "CR81", category: "Income", date: new Date("2025-01-15"), incomeZarCents: 12345, expenseZarCents: 0, photoUrls: [] });
    expect((await getAnalyticsReport(params)).current.totals.incomeCents).toBe(before.current.totals.incomeCents + 12345);
    await deleteTransaction(row.id);
    expect((await getAnalyticsReport(params)).current.totals.incomeCents).toBe(before.current.totals.incomeCents);
    expect((await prisma.transaction.findUnique({ where: { id: row.id } }))?.deletedAt).not.toBeNull();
  });
  it("preserves inactive vehicle history and profile after deactivation", async () => {
    await deactivateVehicle("CR81");
    const detail = await getVehicleDetail("CR81");
    expect(detail?.vehicle.active).toBe(false);
    expect(detail?.vehicle.deletedAt).toBeNull();
    const report = await getAnalyticsReport({ range: "custom", dateFrom: "2025-01-01", dateTo: "2025-01-31" });
    expect(report.current.vehicles.find(row => row.vehicleId === "CR81")?.incomeCents).toBe(100001);
  });
});
