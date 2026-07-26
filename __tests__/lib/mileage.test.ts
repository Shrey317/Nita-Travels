import { describe, it, expect } from "vitest";
import { buildMileageEntry, isValidMileageProgression, averageWeeklyKm } from "@/lib/mileage";

describe("buildMileageEntry", () => {
  it("computes distance as current minus previous", () => {
    const result = buildMileageEntry(new Date(Date.UTC(2026, 6, 20)), 111688, 109688);
    expect(result.distanceDrivenKm).toBe(2000);
  });

  it("flags over-limit by the amount over 2000km by default", () => {
    const result = buildMileageEntry(new Date(Date.UTC(2026, 6, 20)), 111688, 100000);
    expect(result.distanceDrivenKm).toBe(11688);
    expect(result.overLimitByKm).toBe(9688);
  });

  it("does not flag over-limit at exactly 2000km", () => {
    const result = buildMileageEntry(new Date(Date.UTC(2026, 6, 20)), 102000, 100000);
    expect(result.distanceDrivenKm).toBe(2000);
    expect(result.overLimitByKm).toBeNull();
  });

  it("does not flag over-limit under 2000km", () => {
    const result = buildMileageEntry(new Date(Date.UTC(2026, 6, 20)), 101000, 100000);
    expect(result.overLimitByKm).toBeNull();
  });

  it("respects a custom weekly limit", () => {
    const result = buildMileageEntry(new Date(Date.UTC(2026, 6, 20)), 103000, 100000, 2500);
    expect(result.distanceDrivenKm).toBe(3000);
    expect(result.overLimitByKm).toBe(500);
  });

  it("derives the correct ISO week and year", () => {
    // 20 Jul 2026 is a Monday in ISO week 30 of 2026.
    const result = buildMileageEntry(new Date(Date.UTC(2026, 6, 20)), 100100, 100000);
    expect(result.isoYear).toBe(2026);
    expect(result.isoWeek).toBe(30);
  });

  it("handles a zero-distance first-baseline entry (SRS 12.4's CR01 case) without flagging over-limit", () => {
    const result = buildMileageEntry(new Date(Date.UTC(2026, 2, 29)), 86846, 86846);
    expect(result.distanceDrivenKm).toBe(0);
    expect(result.overLimitByKm).toBeNull();
  });
});

describe("isValidMileageProgression", () => {
  it("accepts a current reading strictly greater than the previous one", () => {
    expect(isValidMileageProgression(100001, 100000)).toBe(true);
  });

  it("rejects a current reading equal to the previous one", () => {
    expect(isValidMileageProgression(100000, 100000)).toBe(false);
  });

  it("rejects a current reading less than the previous one", () => {
    expect(isValidMileageProgression(99999, 100000)).toBe(false);
  });
});

describe("averageWeeklyKm", () => {
  it("averages a list of distances", () => {
    expect(averageWeeklyKm([700, 700, 700, 700])).toBe(700);
    expect(averageWeeklyKm([600, 800])).toBe(700);
  });

  it("returns null for an empty list rather than dividing by zero", () => {
    expect(averageWeeklyKm([])).toBeNull();
  });

  it("handles a single entry", () => {
    expect(averageWeeklyKm([1234])).toBe(1234);
  });
});
