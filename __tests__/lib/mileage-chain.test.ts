import { describe, expect, it } from "vitest";
import { deriveMileageChain } from "@/lib/mileage-chain";
import { WEEKLY_MILEAGE_LIMIT } from "@/lib/mileage";

function reading(id: string, date: string, km: number, createdAt = "2026-01-01T00:00:00Z") {
  return { id, date: new Date(date), createdAt: new Date(createdAt), currentMileageKm: km, weeklyLimitKm: WEEKLY_MILEAGE_LIMIT };
}

describe("historical mileage chain", () => {
  it("accepts a backfill between its chronological neighbors, regardless of input order", () => {
    const chain = deriveMileageChain([reading("last", "2026-01-21", 13_000), reading("first", "2026-01-07", 11_000), reading("backfill", "2026-01-14", 12_500)], 10_000, "backfill");
    expect(chain.map((entry) => [entry.id, entry.previousMileageKm, entry.distanceDrivenKm])).toEqual([
      ["first", 10_000, 1_000], ["backfill", 11_000, 1_500], ["last", 12_500, 500],
    ]);
  });
  it("rejects an edited reading that passes its successor instead of persisting a negative distance", () => {
    expect(() => deriveMileageChain([reading("first", "2026-01-07", 12_000), reading("last", "2026-01-14", 11_500)], 10_000, "first")).toThrow(/preceding reading/);
  });
  it("rejects equal readings and a first reading below purchase mileage", () => {
    expect(() => deriveMileageChain([reading("first", "2026-01-07", 10_000)], 10_000)).toThrow();
    expect(() => deriveMileageChain([reading("first", "2026-01-07", 9_000)], 10_000)).toThrow();
  });
  it("preserves the established 5,000 km entry validation while allowing a gap bridged after deletion", () => {
    const entries = [reading("last", "2026-01-21", 16_000)];
    expect(() => deriveMileageChain(entries, 10_000, "last")).toThrow(/5,000/);
    expect(deriveMileageChain(entries, 10_000)[0]?.distanceDrivenKm).toBe(6_000);
  });
  it("orders same-day readings by creation then ID and retains ISO year boundaries", () => {
    const chain = deriveMileageChain([reading("b", "2021-01-01", 2_000), reading("a", "2021-01-01", 1_000)], 0);
    expect(chain.map((row) => row.id)).toEqual(["a", "b"]);
    expect(chain[0]).toMatchObject({ isoYear: 2020, isoWeek: 53 });
  });
  it("recomputes over-limit evidence from the central mileage rule", () => {
    expect(deriveMileageChain([reading("first", "2026-01-07", 12_500)], 10_000)[0]).toMatchObject({ distanceDrivenKm: 2_500, overLimitByKm: 500 });
    expect(deriveMileageChain([], 10_000)).toEqual([]);
  });
});
