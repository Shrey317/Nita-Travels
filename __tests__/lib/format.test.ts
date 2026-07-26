import { describe, it, expect } from "vitest";
import { formatZAR, formatKm, profitMargin, formatMargin, centsToRand, randToCents, formatDate, formatMonthKey, formatVehicleLabel } from "@/lib/format";

describe("formatZAR", () => {
  // en-ZA locale formatting genuinely uses a non-breaking space (\u00a0) as the thousands
  // separator and a comma as the decimal point (verified against Node's real Intl
  // implementation, not assumed) — unusual to a US/UK-formatting eye, but correct, authentic
  // South African number formatting, and exactly what the spec's own toLocaleString("en-ZA", ...)
  // snippet produces. The non-breaking space is a genuine improvement over a plain space too:
  // it stops "R" and the amount from ever being split across a line wrap.
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

describe("profitMargin", () => {
  it("computes a positive margin", () => {
    expect(profitMargin(100000, 75000)).toBeCloseTo(0.25, 10);
  });

  it("computes a negative margin when expenses exceed income", () => {
    expect(profitMargin(100000, 150000)).toBeCloseTo(-0.5, 10);
  });

  it("computes a margin of exactly 1 when there is no expense", () => {
    expect(profitMargin(100000, 0)).toBeCloseTo(1, 10);
  });

  it("returns null when income is zero — margin is undefined, not zero", () => {
    expect(profitMargin(0, 5000)).toBeNull();
    expect(profitMargin(0, 0)).toBeNull();
  });

  it("uses (income - expense) / income, never income/expense - 1", () => {
    // The two formulas coincide only in degenerate cases; at these numbers they diverge,
    // which is exactly what SRS 25's "Margin formula inconsistency in Excel" correction guards.
    const wrongFormula = 100000 / 75000 - 1;
    const correctFormula = profitMargin(100000, 75000);
    expect(correctFormula).not.toBeCloseTo(wrongFormula, 5);
  });
});

describe("formatMargin", () => {
  it("formats a positive margin as a percentage string to one decimal place", () => {
    expect(formatMargin(100000, 75000)).toBe("25.0%");
  });

  it("renders an em dash when income is zero", () => {
    expect(formatMargin(0, 5000)).toBe("—");
  });

  it("stays derived from profitMargin rather than recomputing independently", () => {
    const raw = profitMargin(200000, 150000);
    expect(raw).not.toBeNull();
    expect(formatMargin(200000, 150000)).toBe(`${(raw as number * 100).toFixed(1)}%`);
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
