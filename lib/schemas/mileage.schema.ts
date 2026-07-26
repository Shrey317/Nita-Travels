import { z } from "zod";

/**
 * previousMileageKm is deliberately NOT part of this schema. SRS 13.5 requires it to always be
 * fetched server-side from the vehicle's most recent MileageEntry (never trusted from the client),
 * so there is nothing to validate on that field — lib/db/mileage.ts computes it after this payload
 * passes validation, and rejects the write if currentMileageKm doesn't exceed it.
 */
export const mileageEntrySchema = z.object({
  date: z.coerce.date(),
  vehicleId: z.string().regex(/^[A-Z]{2}\d{2,}$/, "Select a vehicle"),
  currentMileageKm: z.number().int().positive("Current mileage must be a positive number"),
  photoUrls: z.array(z.string().url()).default([]),
});

export type MileageEntryInput = z.infer<typeof mileageEntrySchema>;
