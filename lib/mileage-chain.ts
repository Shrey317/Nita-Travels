import { buildMileageEntry, isValidMileageProgression, validateMileageReading } from "@/lib/mileage";
import { ValidationError } from "@/lib/errors";

export interface MileageChainReading {
  id: string;
  date: Date;
  createdAt: Date;
  currentMileageKm: number;
  weeklyLimitKm: number;
}

/** Reconcile date-only readings with a stable insertion order for readings on the same day. */
export function deriveMileageChain<T extends MileageChainReading>(entries: T[], baselineKm: number, changedId?: string) {
  const chronological = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime() ||
    a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
  const changedIndex = changedId !== undefined ? chronological.findIndex((entry) => entry.id === changedId) : -1;
  let previousMileageKm = baselineKm;
  return chronological.map((entry, index) => {
    // Validate the mutated reading and its immediate successor (or the first reading when baseline changes).
    // Untouched historical entries are not re-validated so legacy data anomalies do not block new readings.
    const shouldValidateProgression = changedId !== undefined
      ? changedIndex !== -1 && (index === changedIndex || index === changedIndex + 1)
      : index === 0;
    if (shouldValidateProgression && !isValidMileageProgression(entry.currentMileageKm, previousMileageKm)) {
      throw new ValidationError(`Reading on ${entry.date.toISOString().slice(0, 10)} must be greater than the preceding reading or purchase mileage.`, "currentMileageKm");
    }
    if (entry.id === changedId) {
      const error = validateMileageReading(entry.currentMileageKm, previousMileageKm);
      if (error) throw new ValidationError(`Reading on ${entry.date.toISOString().slice(0, 10)} is invalid: ${error}`, "currentMileageKm");
    }
    const result = { ...entry, previousMileageKm, ...buildMileageEntry(entry.date, entry.currentMileageKm, previousMileageKm, entry.weeklyLimitKm) };
    previousMileageKm = entry.currentMileageKm;
    return result;
  });
}
