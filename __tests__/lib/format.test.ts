import { describe, it, expect } from "vitest";
import { formatZAR, formatKm, formatMargin, centsToRand, randToCents, formatDate, formatMonthKey, formatVehicleLabel } from "@/lib/format";

describe("formatZAR", () => {
  const NBSP = "\u00a0";

  it("formats a whole rand amount with two decimal places", () => {
    expect(formatZAR(150000)).toBe(`R 1${NBSP}500,00`);
  });

  it("formats zero", () => {
    expect(formatZAR(0)).toBe("R 0,00");
  });

  it("formats an amount that includes cents", () => {
    expect(formatZAR(123456)).toBe(`R 1${NBSP}234,56`);
  });

  it("formats a large amount with thousands separators", () => {
    expect(formatZAR(1_400_000_00)).toBe(`R 1${NBSP}400${NBSP}000,00`);
  });
});

describe("formatKm", () => {
  it("formats a positive km value with en-ZA's non-breaking-space thousands separator", () => {
    expect(formatKm(111688)).toBe("111\u00a0688 km");
  });

  it("renders null as an em dash", () => {
    expect(formatKm(null)).toBe("—");
  });

  it("renders undefined as an em dash", () => {
    expect(formatKm(undefined)).toBe("—");
  });

  it("formats zero as a real value, not a dash", () => {
    expect(formatKm(0)).toBe("0 km");
  });
});

describe("formatMargin", () => {
  it("formats a positive margin as a percentage string to one decimal place", () => {
    expect(formatMargin(100000, 75000)).toBe("25.0%");
  });

  it("renders an em dash when income is zero", () => {
    expect(formatMargin(0, 5000)).toBe("—");
  });
});

describe("centsToRand / randToCents", () => {
  it("round-trips a whole rand amount", () => {
    expect(centsToRand(150000)).toBe(1500);
    expect(randToCents(1500)).toBe(150000);
  });

  it("round-trips a fractional rand amount", () => {
    expect(centsToRand(123456)).toBeCloseTo(1234.56, 10);
    expect(randToCents(1234.56)).toBe(123456);
  });

  it("randToCents rounds away float drift instead of truncating", () => {
    expect(randToCents(19.999999999999996)).toBe(2000);
  });
});

describe("formatDate", () => {
  it("formats a UTC-midnight Date as 'd MMM yyyy'", () => {
    expect(formatDate(new Date(Date.UTC(2026, 6, 20)))).toBe("20 Jul 2026");
  });

  it("formats an ISO date string the same way", () => {
    expect(formatDate("2026-07-20")).toBe("20 Jul 2026");
  });

  it("does not shift the day near a month boundary", () => {
    expect(formatDate(new Date(Date.UTC(2026, 0, 1)))).toBe("1 Jan 2026");
    expect(formatDate(new Date(Date.UTC(2025, 11, 31)))).toBe("31 Dec 2025");
  });
});

describe("formatMonthKey", () => {
  it("formats a Date as 'MMM-yyyy'", () => {
    expect(formatMonthKey(new Date(Date.UTC(2026, 6, 20)))).toBe("Jul-2026");
  });

  it("uses a 3-letter month abbreviation", () => {
    expect(formatMonthKey(new Date(Date.UTC(2024, 0, 1)))).toBe("Jan-2024");
  });
});

describe("formatVehicleLabel", () => {
  it("returns a real vehicle id as-is", () => {
    expect(formatVehicleLabel("CR01")).toBe("CR01");
  });

  it("returns a friendly label for the fleet-wide sentinel", () => {
    expect(formatVehicleLabel("ALLCR")).toBe("All Vehicles");
  });

  it("returns an em dash for null", () => {
    expect(formatVehicleLabel(null)).toBe("—");
  });
});
