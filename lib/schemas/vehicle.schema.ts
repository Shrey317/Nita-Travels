import { z } from "zod";

/** CR01, CR02, ... CR10, CR11 — two letters then two-or-more digits, so the fleet can grow. */
export const vehicleIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}\d{2,}$/, "Vehicle ID must look like CR01 (2 letters + 2+ digits)");

const vehicleBaseSchema = z.object({
  id: vehicleIdSchema,
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  registration: z.string().trim().min(1, "Registration is required"),
  registration2: z.string().trim().min(1).nullable().optional(),
  transmission: z.enum(["Manual", "Auto"], { errorMap: () => ({ message: "Select Manual or Auto" }) }),
  purchaseDate: z.coerce.date(),
  purchasePriceCents: z.number().int().nonnegative(),
  mileageAtPurchaseKm: z.number().int().nonnegative(),
  currentMileageKm: z.number().int().nonnegative(),
  warranty: z.string().trim().nullable().optional(),
  serviceIntervalKm: z.number().int().positive().default(20000),
  targetEmiCents: z.number().int().nonnegative().default(0),
  emiMonthsTotal: z.number().int().nonnegative().default(0),
  emiMonthsPaid: z.number().int().nonnegative().default(0),
  insurer: z.string().trim().nullable().optional(),
  policyNumber: z.string().trim().nullable().optional(),
  monthlyPremiumCents: z.number().int().nonnegative().default(0),
  insurancePeriodMonths: z.number().int().nonnegative().default(0),
  insuranceEndDate: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
});

/** Full validation used on create, and again on the merged record after a PATCH (see note.schema.ts pattern). */
export const vehicleSchema = vehicleBaseSchema.refine((d) => d.emiMonthsPaid <= d.emiMonthsTotal, {
  message: "Months paid can't exceed the total EMI term",
  path: ["emiMonthsPaid"],
});

/** Shape-only validation for a PATCH body. The API route merges this with the existing row, then
 *  re-validates the full merged object against `vehicleSchema` before writing — see lib/db/vehicles.ts. */
export const vehicleUpdateSchema = vehicleBaseSchema.omit({ id: true }).partial();

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
