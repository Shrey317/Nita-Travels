import { z } from "zod";

/** CR01-CR09(+) for one vehicle, "ALLCR" for "All Vehicles / Fleet-Wide", or null for "No Specific Vehicle". */
export const noteVehicleRefSchema = z
  .union([z.string().regex(/^[A-Z]{2}\d{2,}$/), z.literal("ALLCR")])
  .nullable();

/** No character limit by design (SRS 11, 15.9) — this is a deliberate spec choice, not an oversight. */
export const vehicleNoteSchema = z.object({
  date: z.coerce.date(),
  vehicleId: noteVehicleRefSchema,
  note: z.string().trim().min(1, "Note can't be empty"),
  photoUrls: z.array(z.string().url()).default([]),
});

export type VehicleNoteInput = z.infer<typeof vehicleNoteSchema>;
