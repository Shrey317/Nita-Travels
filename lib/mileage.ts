/**
 * lib/mileage.ts
 *
 * Pure business logic for mileage-log entries. Nothing here touches the database.
 * lib/db/mileage.ts is responsible for fetching previousMileageKm server-side (SRS 13.5):
 * it is the currentMileageKm of the vehicle's most recent MileageEntry, or — for a vehicle's
 * very first-ever entry, where no prior MileageEntry exists — the vehicle's own
 * currentMileageKm baseline. Client-submitted "previous mileage" values are always ignored.
 */

import { getISOWeek, getISOWeekYear, startOfWeek, endOfWeek } from "date-fns";

export const WEEKLY_MILEAGE_LIMIT = 2000;

/**
 * Returns the start of the business week (Monday 00:00:00).
 */
export function getBusinessWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Returns the end of the business week (Sunday 23:59:59.999).
 */
export function getBusinessWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export interface MileageEntryDerived {
  distanceDrivenKm: number;
  isoWeek: number;
  isoYear: number;
  overLimitByKm: number | null;
}

/**
 * Derives the stored fields for a new mileage entry from a date and the current/previous
 * odometer readings. weeklyLimitKm defaults to 2000, matching the schema default and the
 * fleet-wide policy in the spec; it's a parameter (not a hardcoded literal) so a future
 * per-vehicle limit doesn't require touching this formula.
 */
export function buildMileageEntry(
  date: Date,
  currentKm: number,
  previousKm: number,
  weeklyLimitKm: number = WEEKLY_MILEAGE_LIMIT
): MileageEntryDerived {
  const distance = currentKm - previousKm;
  return {
    distanceDrivenKm: distance,
    isoWeek: getISOWeek(date),
    isoYear: getISOWeekYear(date),
    overLimitByKm: distance > weeklyLimitKm ? distance - weeklyLimitKm : null,
  };
}

/** A new mileage reading must always exceed the previous one — odometers don't run backwards. */
export function isValidMileageProgression(currentKm: number, previousKm: number): boolean {
  return currentKm > previousKm;
}

/**
 * Validates a mileage reading. Returns an error message if invalid, or null if valid.
 */
export function validateMileageReading(newMileageKm: number, previousMileageKm: number): string | null {
  if (newMileageKm < previousMileageKm) {
    return "New mileage reading cannot be lower than the previous reading.";
  }
  if (newMileageKm === previousMileageKm) {
    return "New mileage reading must be greater than the previous reading.";
  }
  if (newMileageKm - previousMileageKm > 5000) {
    return "Unrealistic mileage increase detected (> 5,000 km in a single reading). Please verify.";
  }
  return null;
}

/**
 * Average weekly distance from recent mileage entries, used to project "days to next service"
 * (SRS 15.6, drawn from the last 8 MileageEntry rows for the vehicle). Returns null for an
 * empty input so callers can render "—" instead of dividing by zero.
 */
export function averageWeeklyKm(recentDistances: number[]): number | null {
  if (recentDistances.length === 0) return null;
  const total = recentDistances.reduce((sum, km) => sum + km, 0);
  return total / recentDistances.length;
}
