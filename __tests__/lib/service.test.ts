import { describe, it, expect } from "vitest";
import {
  computeServiceStatus,
  computeNextSvcKm,
  computeKmRemaining,
  deriveServiceStatus,
  estimateDaysToNext,
  SERVICE_STATUS_SORT_ORDER,
  badgeLabel,
  badgeVariant,
} from "@/lib/service";

describe("computeServiceStatus", () => {
  it("returns NEEDS_DATA when kmRemaining is null — never OVERDUE from missing data", () => {
    expect(computeServiceStatus(null)).toBe("NEEDS_DATA");
  });

  it("returns OVERDUE when kmRemaining is negative", () => {
    expect(computeServiceStatus(-1)).toBe("OVERDUE");
    expect(computeServiceStatus(-1688)).toBe("OVERDUE");
  });

  it("returns DUE_SOON when kmRemaining is between 0 and 3000 (exclusive of 3000)", () => {
    expect(computeServiceStatus(0)).toBe("DUE_SOON");
    expect(computeServiceStatus(1500)).toBe("DUE_SOON");
    expect(computeServiceStatus(2999)).toBe("DUE_SOON");
  });

  it("returns OK at exactly 3000 and above", () => {
    expect(computeServiceStatus(3000)).toBe("OK");
    expect(computeServiceStatus(50000)).toBe("OK");
  });
});

describe("computeNextSvcKm", () => {
  it("adds the service interval to the last service mileage", () => {
    expect(computeNextSvcKm(90000, 20000)).toBe(110000);
  });

  it("returns null when there is no last service mileage", () => {
    expect(computeNextSvcKm(null, 20000)).toBeNull();
  });
});

describe("computeKmRemaining", () => {
  it("computes the difference between next-service and current mileage", () => {
    expect(computeKmRemaining(110000, 111688)).toBe(-1688);
    expect(computeKmRemaining(110000, 100000)).toBe(10000);
  });

  it("returns null when nextSvcKm is null", () => {
    expect(computeKmRemaining(null, 100000)).toBeNull();
  });
});

describe("deriveServiceStatus (full pipeline)", () => {
  it("reproduces the real CR01 case found during data review: overdue once Transactions' mileage is used", () => {
    // Last service (per Transactions, the source of truth) at 90,000km, 20,000km interval,
    // current mileage 111,688km from the latest mileage-log entry.
    const result = deriveServiceStatus(90000, 20000, 111688);
    expect(result.nextSvcKm).toBe(110000);
    expect(result.kmRemaining).toBe(-1688);
    expect(result.status).toBe("OVERDUE");
  });

  it("returns NEEDS_DATA end-to-end when there's no qualifying service record", () => {
    const result = deriveServiceStatus(null, 20000, 50000);
    expect(result.nextSvcKm).toBeNull();
    expect(result.kmRemaining).toBeNull();
    expect(result.status).toBe("NEEDS_DATA");
  });

  it("returns OK when comfortably under the interval", () => {
    const result = deriveServiceStatus(80000, 20000, 85000);
    expect(result.kmRemaining).toBe(15000);
    expect(result.status).toBe("OK");
  });
});

describe("estimateDaysToNext", () => {
  it("converts a weekly rate into a day estimate", () => {
    // 3500 km remaining at 700km/week -> 5 weeks -> 35 days
    expect(estimateDaysToNext(3500, 700)).toBe(35);
  });

  it("returns null when kmRemaining is null", () => {
    expect(estimateDaysToNext(null, 700)).toBeNull();
  });

  it("returns null when there's no driving-rate data (null or zero average)", () => {
    expect(estimateDaysToNext(3500, null)).toBeNull();
    expect(estimateDaysToNext(3500, 0)).toBeNull();
  });

  it("produces a negative day count for an already-overdue vehicle", () => {
    expect(estimateDaysToNext(-1400, 700)).toBe(-14);
  });

  it("rounds to the nearest whole day", () => {
    expect(estimateDaysToNext(1000, 300)).toBe(Math.round((1000 / 300) * 7));
  });
});

describe("SERVICE_STATUS_SORT_ORDER", () => {
  it("orders OVERDUE before DUE_SOON before OK before NEEDS_DATA", () => {
    expect(SERVICE_STATUS_SORT_ORDER.OVERDUE).toBeLessThan(SERVICE_STATUS_SORT_ORDER.DUE_SOON);
    expect(SERVICE_STATUS_SORT_ORDER.DUE_SOON).toBeLessThan(SERVICE_STATUS_SORT_ORDER.OK);
    expect(SERVICE_STATUS_SORT_ORDER.OK).toBeLessThan(SERVICE_STATUS_SORT_ORDER.NEEDS_DATA);
  });
});

describe("badgeLabel / badgeVariant", () => {
  it("has a label and variant for every status", () => {
    const statuses = ["OK", "DUE_SOON", "OVERDUE", "NEEDS_DATA"] as const;
    for (const status of statuses) {
      expect(badgeLabel[status]).toBeTruthy();
      expect(badgeVariant[status]).toBeTruthy();
    }
  });

  it("maps OVERDUE to the destructive variant", () => {
    expect(badgeVariant.OVERDUE).toBe("destructive");
  });
});
