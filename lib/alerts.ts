/**
 * lib/alerts.ts
 *
 * Insurance-expiry alerting — added beyond the original spec at the product owner's request
 * to track more of what the fleet already stores. Vehicle.insuranceEndDate is a real date the
 * schema already captures, so this is a pure derivation with no new data to collect.
 *
 * warranty is deliberately NOT included here: it's a free-text field ("Valid till 2027") rather
 * than a structured date, and parsing arbitrary text into a hard expiry date would be guessing —
 * exactly the kind of approximated business logic the spec's Business Logic Protection Policy
 * rules out. It stays a plain display field until it's captured as a real date.
 */

import { differenceInCalendarDays } from "date-fns";

export type ExpiryStatus = "EXPIRED" | "EXPIRING_SOON" | "OK" | "NO_DATA";

const EXPIRING_SOON_WINDOW_DAYS = 30;

/**
 * Classifies insurance expiry from the stored end date.
 * NO_DATA (not OK) when the date is missing, mirroring the NEEDS_DATA guard in lib/service.ts —
 * an absent fact is never silently treated as a good one.
 */
export function computeInsuranceExpiryStatus(
  insuranceEndDate: Date | null,
  referenceDate: Date = new Date()
): ExpiryStatus {
  if (!insuranceEndDate) return "NO_DATA";
  const daysUntil = differenceInCalendarDays(insuranceEndDate, referenceDate);
  if (daysUntil < 0) return "EXPIRED";
  if (daysUntil <= EXPIRING_SOON_WINDOW_DAYS) return "EXPIRING_SOON";
  return "OK";
}

export const insuranceBadgeLabel: Record<ExpiryStatus, string> = {
  OK: "🟢 Current",
  EXPIRING_SOON: "🟡 Expiring Soon",
  EXPIRED: "🔴 Expired",
  NO_DATA: "No Data",
};

export const insuranceBadgeVariant: Record<ExpiryStatus, "success" | "warning" | "destructive"> = {
  OK: "success",
  EXPIRING_SOON: "warning",
  EXPIRED: "destructive",
  NO_DATA: "warning",
};
