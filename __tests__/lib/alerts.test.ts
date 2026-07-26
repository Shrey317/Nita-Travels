import { describe, it, expect } from "vitest";
import { computeInsuranceExpiryStatus, insuranceBadgeLabel, insuranceBadgeVariant } from "@/lib/alerts";

const REF_DATE = new Date(Date.UTC(2026, 6, 25)); // 25 Jul 2026, matching "today" in this project

describe("computeInsuranceExpiryStatus", () => {
  it("returns NO_DATA when there is no end date — an absent fact, not a good one", () => {
    expect(computeInsuranceExpiryStatus(null, REF_DATE)).toBe("NO_DATA");
  });

  it("returns EXPIRED when the end date is in the past", () => {
    const past = new Date(Date.UTC(2026, 5, 1));
    expect(computeInsuranceExpiryStatus(past, REF_DATE)).toBe("EXPIRED");
  });

  it("returns EXPIRED for yesterday", () => {
    const yesterday = new Date(Date.UTC(2026, 6, 24));
    expect(computeInsuranceExpiryStatus(yesterday, REF_DATE)).toBe("EXPIRED");
  });

  it("returns EXPIRING_SOON for today (0 days out)", () => {
    expect(computeInsuranceExpiryStatus(REF_DATE, REF_DATE)).toBe("EXPIRING_SOON");
  });

  it("returns EXPIRING_SOON at exactly 30 days out", () => {
    const in30 = new Date(Date.UTC(2026, 7, 24));
    expect(computeInsuranceExpiryStatus(in30, REF_DATE)).toBe("EXPIRING_SOON");
  });

  it("returns OK at 31 days out", () => {
    const in31 = new Date(Date.UTC(2026, 7, 25));
    expect(computeInsuranceExpiryStatus(in31, REF_DATE)).toBe("OK");
  });

  it("returns OK for a date far in the future", () => {
    const farFuture = new Date(Date.UTC(2030, 2, 16));
    expect(computeInsuranceExpiryStatus(farFuture, REF_DATE)).toBe("OK");
  });

  it("defaults the reference date to now when not provided", () => {
    // Just confirms it doesn't throw and returns a valid status when called the way real
    // call sites use it (SRS-facing code never passes a referenceDate).
    const status = computeInsuranceExpiryStatus(new Date(Date.UTC(2099, 0, 1)));
    expect(["OK", "EXPIRING_SOON", "EXPIRED", "NO_DATA"]).toContain(status);
  });
});

describe("insuranceBadgeLabel / insuranceBadgeVariant", () => {
  it("has a label and variant for every status", () => {
    const statuses = ["OK", "EXPIRING_SOON", "EXPIRED", "NO_DATA"] as const;
    for (const status of statuses) {
      expect(insuranceBadgeLabel[status]).toBeTruthy();
      expect(insuranceBadgeVariant[status]).toBeTruthy();
    }
  });

  it("maps EXPIRED to the destructive variant", () => {
    expect(insuranceBadgeVariant.EXPIRED).toBe("destructive");
  });
});
