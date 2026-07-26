/**
 * lib/service.ts
 *
 * Pure business logic for service-due computation. Nothing in this file touches the
 * database — callers (lib/db/service.ts) fetch the raw rows and pass in plain numbers.
 * Service status is NEVER persisted; it is derived fresh on every read (SRS 13.1).
 */

export type ServiceStatus = "OK" | "DUE_SOON" | "OVERDUE" | "NEEDS_DATA";

/**
 * Classifies a vehicle's service status from its km-remaining figure.
 * Guard: null means no qualifying service transaction exists (mileageKm was never recorded),
 * which must resolve to NEEDS_DATA — never OVERDUE. A missing data point is not the same
 * fact as an overdue vehicle, and conflating them would print a false alarm.
 */
export function computeServiceStatus(kmRemaining: number | null): ServiceStatus {
  if (kmRemaining === null) return "NEEDS_DATA";
  if (kmRemaining < 0) return "OVERDUE";
  if (kmRemaining < 3000) return "DUE_SOON";
  return "OK";
}

export const badgeLabel: Record<ServiceStatus, string> = {
  OK: "🟢 OK",
  DUE_SOON: "🟡 Due Soon",
  OVERDUE: "🔴 Overdue",
  NEEDS_DATA: "Needs Data",
};

export const badgeVariant: Record<ServiceStatus, "success" | "warning" | "destructive"> = {
  OK: "success",
  DUE_SOON: "warning",
  OVERDUE: "destructive",
  NEEDS_DATA: "warning",
};

/** nextSvcKm is never stored (SRS 11) — always derived as mileage-at-last-service + interval. */
export function computeNextSvcKm(lastServiceMileageKm: number | null, serviceIntervalKm: number): number | null {
  if (lastServiceMileageKm === null) return null;
  return lastServiceMileageKm + serviceIntervalKm;
}

/** Km remaining until the next service is due. Negative means overdue by that many km. */
export function computeKmRemaining(nextSvcKm: number | null, currentMileageKm: number): number | null {
  if (nextSvcKm === null) return null;
  return nextSvcKm - currentMileageKm;
}

/**
 * Full derivation pipeline from raw inputs to a displayable service record, used by the
 * Dashboard's Service Status Overview table and the /service page (SRS 15.1, 15.6).
 */
export interface ServiceDerivation {
  nextSvcKm: number | null;
  kmRemaining: number | null;
  status: ServiceStatus;
}

export function deriveServiceStatus(
  lastServiceMileageKm: number | null,
  serviceIntervalKm: number,
  currentMileageKm: number
): ServiceDerivation {
  const nextSvcKm = computeNextSvcKm(lastServiceMileageKm, serviceIntervalKm);
  const kmRemaining = computeKmRemaining(nextSvcKm, currentMileageKm);
  return { nextSvcKm, kmRemaining, status: computeServiceStatus(kmRemaining) };
}

/**
 * Estimated calendar days until the next service is due (SRS 15.6):
 * days = (kmRemaining / avgWeeklyKm) * 7. A negative kmRemaining (already overdue) naturally
 * produces a negative day count — "due N days ago" — which the UI is responsible for wording.
 * Returns null when there's no km-remaining figure or no driving-rate data to project from.
 */
export function estimateDaysToNext(kmRemaining: number | null, avgWeeklyKm: number | null): number | null {
  if (kmRemaining === null || avgWeeklyKm === null || avgWeeklyKm === 0) return null;
  return Math.round((kmRemaining / avgWeeklyKm) * 7);
}

/** Sort order for the /service page: OVERDUE -> DUE_SOON -> OK -> NEEDS_DATA (SRS 15.6). */
export const SERVICE_STATUS_SORT_ORDER: Record<ServiceStatus, number> = {
  OVERDUE: 0,
  DUE_SOON: 1,
  OK: 2,
  NEEDS_DATA: 3,
};
