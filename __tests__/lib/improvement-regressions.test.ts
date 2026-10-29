import { describe, expect, it, vi, afterEach } from "vitest";
import { transactionUpdateSchema } from "@/lib/schemas/transaction.schema";
import { vehicleUpdateSchema } from "@/lib/schemas/vehicle.schema";
import { parsePageListQuery } from "@/lib/query-filters";
import { businessToday, dateKey } from "@/lib/date-ranges";

describe("safe partial edits and calendar filters", () => {
  afterEach(() => vi.useRealTimers());
  it("does not reset money, attachments, finance or active state on unrelated edits", () => {
    expect(transactionUpdateSchema.parse({ notes: "Corrected note" })).toEqual({ notes: "Corrected note" });
    expect(vehicleUpdateSchema.parse({ registration: "NEW" })).toEqual({ registration: "NEW" });
  });
  it("rejects invalid page/date inputs with actionable page feedback", () => {
    expect(parsePageListQuery({ page: "-1.5" }).error).toBeTruthy();
    expect(parsePageListQuery({ dateFrom: "2026-02-30" }).error).toBeTruthy();
    expect(parsePageListQuery({ dateFrom: "2026-10-02", dateTo: "2026-10-01" }).error).toBeTruthy();
    expect(parsePageListQuery({ vehicleId: ["CR01", "ALLCR"], page: "2" }).filters).toMatchObject({ vehicleId: ["CR01", "ALLCR"], page: 2 });
  });
  it("uses the Johannesburg calendar day just after local midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T22:30:00Z"));
    expect(dateKey(businessToday())).toBe("2026-10-28");
  });
});
