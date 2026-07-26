import { z } from "zod";

export const categorySchema = z.enum([
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
]);

/** CR01-CR09(+) for a real vehicle, "ALLCR" for a fleet-wide entry, or null for no vehicle (e.g. loan repayments). */
export const transactionVehicleRefSchema = z
  .union([z.string().regex(/^[A-Z]{2}\d{2,}$/), z.literal("ALLCR")])
  .nullable();

const transactionBaseSchema = z.object({
  date: z.coerce.date(),
  vehicleId: transactionVehicleRefSchema,
  category: categorySchema,
  incomeZarCents: z.number().int().nonnegative().default(0),
  expenseZarCents: z.number().int().nonnegative().default(0),
  notes: z.string().trim().max(2000).nullable().optional(),
  mileageKm: z.number().int().nonnegative().nullable().optional(),
  photoUrls: z.array(z.string().url()).default([]),
});

/**
 * Full cross-field validation (SRS 15.5), used on create and again on the merged record after
 * a PATCH — a partial update is merged with the existing row first, then the complete result is
 * checked here, so these rules can never be bypassed by editing one field at a time.
 */
export const transactionSchema = transactionBaseSchema
  .refine((d) => d.incomeZarCents > 0 || d.expenseZarCents > 0 || d.category === "Service", {
    message: "Income and expense can't both be zero (a R0 entry is only allowed for a free/warranty Service record)",
    path: ["expenseZarCents"],
  })
  .refine((d) => !(d.incomeZarCents > 0 && d.expenseZarCents > 0), {
    message: "A transaction can't have both income and expense — record them as two separate entries",
    path: ["incomeZarCents"],
  })
  .refine((d) => d.category !== "Service" || (d.mileageKm !== null && d.mileageKm !== undefined), {
    message: "Mileage at service is required for Service entries",
    path: ["mileageKm"],
  });

/** Shape-only validation for a PATCH body — see transactionSchema's comment for how it's applied. */
export const transactionUpdateSchema = transactionBaseSchema.partial();

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
