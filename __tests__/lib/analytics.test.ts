import { describe, expect, it } from "vitest";
import { analyzeMileage, buildPeriodAnalysis, detectRepeatRepairs, explainProfitChange, recordedOwnershipCost, summarizeFinancialRows, type AnalyticsTransaction, type AnalyticsMileage, type AnalyticsVehicle } from "@/lib/analytics";
import { aggregatePeriods, isoWeekIdentity } from "@/lib/periods";
import { addDays, businessToday, dateKey, monthlySelection, parseCalendarDate, parseDateRange, resolveAnalyticsSelection } from "@/lib/date-ranges";
import { calculateChange } from "@/lib/finance";
import { csvRows } from "@/lib/reports";

const date = (value: string) => new Date(`${value}T00:00:00Z`);
const vehicle: AnalyticsVehicle = { id: "CR01", registration: "TEST", active: true, purchasePriceCents: 1000000, purchaseDate: date("2024-01-01"), currentMileageKm: 13000, mileageAtPurchaseKm: 10000, insurer: "Test", policyNumber: "P1", insuranceEndDate: date("2027-01-01"), warranty: "No warranty" };
const tx = (id: string, day: string, income: number, expense: number, category = income ? "Income" : "Fuel", vehicleId: string | null = "CR01"): AnalyticsTransaction => ({ id, date: date(day), incomeZarCents: income, expenseZarCents: expense, category, vehicleId });
const km = (id: string, day: string, distance: number, vehicleId = "CR01"): AnalyticsMileage => ({ id, date: date(day), vehicleId, previousMileageKm: 10000, currentMileageKm: 10000 + distance, distanceDrivenKm: distance });
const range = { from: date("2026-01-01"), to: date("2026-01-31") };

describe("source-reconciled analytics", () => {
  const transactions = [tx("a", "2026-01-01", 100001, 0), tx("b", "2026-01-10", 0, 30001, "Repairs"), tx("c", "2026-01-20", 0, 1000, "Service"), tx("d", "2026-01-31", 0, 900, "Other", "ALLCR"), tx("e", "2026-01-31", 0, 99, "Other", null), tx("inactive", "2026-01-15", 50000, 0, "Income", "CR02"), { ...tx("deleted", "2026-01-05", 999999, 0), deletedAt: date("2026-01-06") }, tx("outside", "2025-12-31", 777, 0)];
  const vehicles = [vehicle, { ...vehicle, id: "CR02", active: false }];
  const mileage = [km("m1", "2026-01-09", 1000), km("m2", "2026-01-16", 1500)];
  it("includes inactive, ALLCR and unassigned history but excludes deleted and out-of-range records", () => {
    const report = buildPeriodAnalysis({ transactions, vehicles, mileage, range });
    expect(report.totals.incomeCents).toBe(150001);
    expect(report.totals.expenseCents).toBe(32000);
    expect(report.totals.netProfitCents).toBe(118001);
    expect(report.totals.repairsCents).toBe(30001);
    expect(report.totals.maintenanceCents).toBe(31001);
    expect(report.unallocated.expenseCents).toBe(999);
    expect(report.vehicles.reduce((sum, row) => sum + row.netProfitCents, report.unallocated.netProfitCents)).toBe(report.totals.netProfitCents);
  });
  it("reconciles weekly, monthly and dashboard/analytics totals for exact year-boundary dates", () => {
    const report = buildPeriodAnalysis({ transactions, vehicles, mileage, range });
    for (const frequency of ["week", "month"] as const) {
      const rows = aggregatePeriods(transactions, mileage, range, frequency);
      expect(rows.reduce((sum, row) => sum + row.incomeCents, 0)).toBe(report.totals.incomeCents);
      expect(rows.reduce((sum, row) => sum + row.expenseCents, 0)).toBe(report.totals.expenseCents);
      expect(rows.reduce((sum, row) => sum + row.mileageKm, 0)).toBe(2500);
    }
  });
  it("uses period mileage, never the lifetime odometer, for all per-km metrics", () => {
    const report = buildPeriodAnalysis({ transactions, vehicles, mileage, range, vehicleId: "CR01" });
    expect(report.totals.revenuePerKmCents).toBe(100001 / 2500);
    expect(report.totals.profitPerKmCents).toBe((100001 - 31001) / 2500);
    expect(report.vehicles).toHaveLength(1);
    expect(report.unallocated.expenseCents).toBe(0);
  });
  it("keeps zero and missing ratios undefined", () => {
    const report = buildPeriodAnalysis({ transactions: [], vehicles, mileage: [], range });
    expect(report.totals.margin).toBeNull();
    expect(report.totals.costPerKmCents).toBeNull();
    expect(report.dataIssues.some(row => row.id === "mileage-CR01")).toBe(true);
    expect(calculateChange(100, 0)).toEqual({ delta: 100, percent: null });
    expect(calculateChange(-10, -20)).toEqual({ delta: 10, percent: 50 });
    expect(calculateChange(null, 20)).toEqual({ delta: null, percent: null });
  });
  it("profit bridge reconciles category-rounded rolling baselines exactly", () => {
    const current = summarizeFinancialRows(transactions);
    const previous = summarizeFinancialRows([tx("p1", "2025-12-01", 3, 0), tx("p2", "2025-12-02", 0, 7, "Repairs"), tx("p3", "2025-12-03", 0, 11, "Service")], 100, 31 / 28);
    const bridge = explainProfitChange(current, previous);
    expect(bridge.revenueChange + bridge.contributors.reduce((sum, row) => sum + row.profitImpactCents, 0)).toBe(bridge.profitChange);
    expect(Number.isInteger(previous.expenseCents)).toBe(true);
  });
  it("handles cents, losses and large sums without rounding ledger amounts", () => {
    const report = summarizeFinancialRows([tx("a", "2026-01-01", 2147483647, 0), tx("b", "2026-01-01", 2147483647, 0), tx("c", "2026-01-01", 0, 1)]);
    expect(report.netProfitCents).toBe(4294967293);
    expect(summarizeFinancialRows([tx("loss", "2026-01-01", 0, 5)]).netProfitCents).toBe(-5);
  });
});

describe("evidence-based maintenance and mileage", () => {
  it("groups repeat repair categories, excludes deleted and fleet overhead, and shows latest interval", () => {
    const rows = [tx("a", "2026-01-01", 0, 100, "Tyres"), tx("b", "2026-01-10", 0, 200, "Tyres"), tx("c", "2026-01-30", 0, 300, "Tyres"), tx("d", "2026-01-11", 0, 90, "Service"), tx("e", "2026-01-12", 0, 80, "Tyres", "ALLCR"), { ...tx("f", "2026-01-25", 0, 900, "Tyres"), deletedAt: date("2026-01-26") }];
    expect(detectRepeatRepairs(rows)).toEqual([{ vehicleId: "CR01", category: "Tyres", occurrences: 3, previousDate: "2026-01-10", latestDate: "2026-01-30", totalCostCents: 600, daysBetween: 20 }]);
  });
  it("sums multiple entries per vehicle-week before checking 2000 km, excluding incomplete boundaries", () => {
    const result = analyzeMileage([km("a", "2026-01-05", 1200), km("b", "2026-01-09", 1100), km("c", "2026-01-01", 3000)], range);
    expect(result.violations).toHaveLength(1);
    expect(result.overLimitKm).toBe(300);
    expect(result.highestWeeklyKm).toBe(2300);
    expect(result.totalKm).toBe(5300);
  });
  it("compares a selected week with four consecutive prior weeks, including lookback outside selection", () => {
    const readings = Array.from({ length: 5 }, (_, index) => km(String(index), dateKey(addDays(date("2026-01-05"), index * 7)), index === 4 ? 2500 : 1000));
    const result = analyzeMileage(readings, { from: date("2026-02-02"), to: date("2026-02-08") });
    expect(result.totalKm).toBe(2500);
    expect(result.anomalies[0]).toMatchObject({ averageKm: 1000, km: 2500, changePercent: 150 });
    expect(analyzeMileage(readings.filter(row => row.id !== "2"), { from: date("2026-02-02"), to: date("2026-02-08") }).anomalies).toHaveLength(0);
  });
  it("excludes inconsistent distance rather than contaminating profit/km", () => {
    const result = analyzeMileage([{ ...km("bad", "2026-01-05", 100), distanceDrivenKm: -100 }], range);
    expect(result.totalKm).toBe(0);
    expect(result.invalidEntries).toHaveLength(1);
  });
  it("shows transparent partial ownership cost without adding configured premium/EMI", () => {
    expect(recordedOwnershipCost(100000, 160000, 30000)).toEqual({ purchasePriceCents: 100000, recordedOperatingCents: 30000, totalCostCents: 130000, netContributionCents: 30000 });
  });
  it("neutralizes spreadsheet formulas in text while preserving numeric negative profit", () => {
    expect(csvRows([["=1+1", -100, 'A,"B']])).toBe('\'=1+1,-100,"A,""B"');
  });
});

describe("calendar and ISO boundaries", () => {
  it("clamps historical YTD on leap day and shares custom monthly bounds", () => {
    expect(dateKey(monthlySelection({ year: "2023", range: "ytd" }, date("2024-02-29")).selection.range.to)).toBe("2023-02-28");
    const result = monthlySelection({ year: "2025", range: "custom", dateFrom: "2025-01-15", dateTo: "2025-02-10", vehicleId: "CR01" });
    expect(dateKey(result.selection.range.from)).toBe("2025-01-15");
    expect(result.selection.vehicleId).toBe("CR01");
  });
  it("retains full history beyond ten years while bounding user-selected custom spans", () => {
    const history = { from: date("2010-01-01"), to: date("2026-01-31") };
    expect(resolveAnalyticsSelection({ range: "all" }, date("2026-02-01"), history).range).toEqual(history);
    expect(() => resolveAnalyticsSelection({ range: "custom", dateFrom: "2010-01-01", dateTo: "2026-01-31" })).toThrow();
  });
  it.each([["2024-12-30", "2025-W01"], ["2021-01-01", "2020-W53"], ["2021-01-03", "2020-W53"], ["2021-01-04", "2021-W01"], ["2023-12-31", "2023-W52"]])("labels %s as %s", (day, key) => expect(isoWeekIdentity(date(day)).weekKey).toBe(key));
  it("uses Johannesburg's business date at the UTC boundary", () => expect(dateKey(businessToday(new Date("2026-12-31T22:30:00Z")))).toBe("2027-01-01"));
  it("rejects impossible and inverted custom dates", () => {
    expect(() => parseCalendarDate("2025-02-29")).toThrow();
    expect(dateKey(parseCalendarDate("2024-02-29"))).toBe("2024-02-29");
    expect(() => resolveAnalyticsSelection({ range: "custom", dateFrom: "2026-02-01", dateTo: "2026-01-01" })).toThrow();
  });
  it("last 3 months means three months, not four", () => {
    const result = parseDateRange("3-months", date("2026-10-03"));
    expect(dateKey(result.from!)).toBe("2026-08-01"); expect(dateKey(result.to!)).toBe("2026-10-31");
  });
  it("clamps leap day when comparing last year and normalizes rolling daily average", () => {
    const prior = resolveAnalyticsSelection({ range: "custom", dateFrom: "2024-02-29", dateTo: "2024-02-29", comparison: "previous-year" });
    expect(dateKey(prior.comparisonRange.from)).toBe("2023-02-28");
    const rolling = resolveAnalyticsSelection({ range: "custom", dateFrom: "2026-01-01", dateTo: "2026-01-31", comparison: "rolling-4" });
    expect(rolling.comparisonScale).toBe(31 / 28);
    expect(dateKey(rolling.comparisonRange.to)).toBe("2025-12-31");
  });
});
