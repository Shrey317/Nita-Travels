/**
 * lib/format.ts
 *
 * All display formatting for the application lives here. Nothing in this file mutates
 * or derives new business facts — it only turns numbers/dates that other lib/ modules
 * have already computed into the strings the UI shows.
 */

import { format as formatDateFns, parseISO } from "date-fns";
import { FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";
import { calculateProfitMargin } from "@/lib/finance";

/** Formats integer cents as a ZAR currency string, e.g. 1234550 -> "R 12,345.50". */
export function formatZAR(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formats a kilometre value, e.g. 111688 -> "111,688 km". Null renders as "—". */
export function formatKm(km: number | null | undefined): string {
  return km === null || km === undefined ? "—" : `${km.toLocaleString("en-ZA")} km`;
}

/** Formats net profit margin for display, e.g. "23.5%". Renders "—" when income is zero. */
export function formatMargin(incomeCents: number, expenseCents: number): string {
  const margin = calculateProfitMargin(incomeCents, expenseCents);
  return margin === null ? "—" : `${(margin * 100).toFixed(1)}%`;
}

/** Converts integer cents to a Rand float, e.g. 1234550 -> 12345.5. For form inputs only. */
export function centsToRand(cents: number): number {
  return cents / 100;
}

/** Converts a Rand float to integer cents, e.g. 12345.5 -> 1234550. Rounds to avoid float drift. */
export function randToCents(rand: number): number {
  return Math.round(rand * 100);
}

/** Formats a Date or date-only ISO string as "20 Jul 2026", the convention used throughout the app. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDateFns(d, "d MMM yyyy");
}

/** Formats a Date as "Jul-2026" for monthly grouping keys and axis labels. */
export function formatMonthKey(date: Date): string {
  return formatDateFns(date, "MMM-yyyy");
}

/** Turns a raw Transaction.vehicleId into what a table cell should show: the vehicle ID as-is
 *  for a real vehicle, a friendly label for the fleet-wide sentinel, or an em dash for null. */
export function formatVehicleLabel(vehicleId: string | null): string {
  if (!vehicleId) return "—";
  if (vehicleId === FLEET_WIDE_VEHICLE_ID) return "All Vehicles";
  return vehicleId;
}
