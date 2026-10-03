import { buildMileageEntry, validateMileageReading } from "@/lib/mileage";
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
  let previousMileageKm = baselineKm;
  return chronological.map((entry) => {
    if (entry.currentMileageKm <= previousMileageKm) {
      throw new ValidationError(`Reading on ${entry.date.toISOString().slice(0, 10)} must exceed the preceding reading (${previousMileageKm.toLocaleString("en-ZA")} km). Check the readings before and after this entry.`, "currentMileageKm");
    }
    if (entry.id === changedId) {
      const error = validateMileageReading(entry.currentMileageKm, previousMileageKm);
      if (error) throw new ValidationError(error, "currentMileageKm");
    }
    const result = { ...entry, previousMileageKm, ...buildMileageEntry(entry.date, entry.currentMileageKm, previousMileageKm, entry.weeklyLimitKm) };
    previousMileageKm = entry.currentMileageKm;
    return result;
  });
}
