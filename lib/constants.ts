/**
 * lib/constants.ts
 *
 * Values referenced from more than one lib/ or app/ module, kept in one place so a change
 * (e.g. what counts as a "repair") only has to happen once (SRS Section 5: avoid duplicated
 * logic across the codebase).
 */

/** Repairs = Transactions in these categories (SRS 13.4) — a filtered view, not a stored fact. */
export const REPAIR_CATEGORIES = ["Repairs", "BrakePads", "Tyres"] as const;

export const ALL_CATEGORIES = [
  "Service",
  "Fuel",
  "Tyres",
  "BrakePads",
  "Repairs",
  "License",
  "Maintenance",
  "Other",
  "UberFees",
  "Income",
] as const;

export const DEFAULT_PAGE_SIZE = 50;

/** Display labels for enum values whose stored form isn't screen-friendly on its own
 *  (e.g. "BrakePads" -> "Brake Pads"). Categories not listed here display as-is. */
export const CATEGORY_LABELS: Record<string, string> = {
  BrakePads: "Brake Pads",
  UberFees: "Uber Fees",
};

/** Sentinel used in vehicle-filter multi-selects to represent "vehicleId IS NULL" (SRS 15.4). */
export const NO_VEHICLE_FILTER_VALUE = "NONE";

export const FLEET_WIDE_VEHICLE_ID = "ALLCR";
