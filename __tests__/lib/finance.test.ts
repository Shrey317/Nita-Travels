import { describe, it, expect } from "vitest";
import {
  calculateProfitMargin,
  calculateRoiPercent,
  calculateRevenuePerKm,
  calculateCostPerKm,
  calculateProfitPerKm,
} from "@/lib/finance";

describe("calculateProfitMargin", () => {
  it("returns the correct margin for normal values", () => {
    // (10000 - 4000) / 10000 = 0.6
    expect(calculateProfitMargin(10000, 4000)).toBeCloseTo(0.6);
  });

  it("returns null when income is zero (undefined margin)", () => {
    expect(calculateProfitMargin(0, 5000)).toBeNull();
  });

  it("handles negative profit (expense > income)", () => {
    // (5000 - 8000) / 5000 = -0.6
    expect(calculateProfitMargin(5000, 8000)).toBeCloseTo(-0.6);
  });

  it("returns 1.0 when expense is zero", () => {
    expect(calculateProfitMargin(10000, 0)).toBeCloseTo(1.0);
  });
});

describe("calculateRoiPercent", () => {
  it("returns the correct ROI percentage", () => {
    // (5000 / 100000) * 100 = 5%
    expect(calculateRoiPercent(5000, 100000)).toBeCloseTo(5);
  });

  it("returns null when purchase price is zero", () => {
    expect(calculateRoiPercent(5000, 0)).toBeNull();
  });

  it("handles negative ROI", () => {
    expect(calculateRoiPercent(-10000, 100000)).toBeCloseTo(-10);
  });
});

describe("calculateRevenuePerKm", () => {
  it("returns revenue per km in cents", () => {
    // 100000 / 5000 = 20
    expect(calculateRevenuePerKm(100000, 5000)).toBeCloseTo(20);
  });

  it("returns null when km is zero", () => {
    expect(calculateRevenuePerKm(100000, 0)).toBeNull();
  });

  it("returns null when km is negative", () => {
    expect(calculateRevenuePerKm(100000, -1)).toBeNull();
  });
});

describe("calculateCostPerKm", () => {
  it("returns cost per km in cents", () => {
    expect(calculateCostPerKm(50000, 5000)).toBeCloseTo(10);
  });

  it("returns null when km is zero", () => {
    expect(calculateCostPerKm(50000, 0)).toBeNull();
  });
});

describe("calculateProfitPerKm", () => {
  it("returns profit per km in cents", () => {
    expect(calculateProfitPerKm(50000, 5000)).toBeCloseTo(10);
  });

  it("handles negative profit per km", () => {
    expect(calculateProfitPerKm(-50000, 5000)).toBeCloseTo(-10);
  });

  it("returns null when km is zero", () => {
    expect(calculateProfitPerKm(50000, 0)).toBeNull();
  });
});
