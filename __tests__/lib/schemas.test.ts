import { describe, it, expect } from "vitest";
import { vehicleSchema } from "@/lib/schemas/vehicle.schema";
import { transactionSchema } from "@/lib/schemas/transaction.schema";
import { mileageEntrySchema } from "@/lib/schemas/mileage.schema";
import { vehicleNoteSchema } from "@/lib/schemas/note.schema";

const baseVehicle = {
  id: "CR10",
  make: "Suzuki",
  model: "S PRESSO",
  registration: "AB 12 CD GP",
  registration2: null,
  transmission: "Manual" as const,
  purchaseDate: "2026-01-01",
  purchasePriceCents: 14000000,
  mileageAtPurchaseKm: 0,
  currentMileageKm: 0,
  warranty: null,
  serviceIntervalKm: 20000,
  targetEmiCents: 200000,
  emiMonthsTotal: 60,
  emiMonthsPaid: 0,
  insurer: null,
  policyNumber: null,
  monthlyPremiumCents: 200000,
  insurancePeriodMonths: 60,
  insuranceEndDate: null,
  active: true,
};

describe("vehicleSchema", () => {
  it("accepts a well-formed vehicle", () => {
    expect(vehicleSchema.safeParse(baseVehicle).success).toBe(true);
  });

  it("rejects an id that doesn't look like CR01", () => {
    const result = vehicleSchema.safeParse({ ...baseVehicle, id: "10" });
    expect(result.success).toBe(false);
  });

  it("accepts a fleet-growth id beyond CR09, e.g. CR12", () => {
    const result = vehicleSchema.safeParse({ ...baseVehicle, id: "CR12" });
    expect(result.success).toBe(true);
  });

  it("rejects emiMonthsPaid greater than emiMonthsTotal", () => {
    const result = vehicleSchema.safeParse({ ...baseVehicle, emiMonthsTotal: 10, emiMonthsPaid: 11 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("emiMonthsPaid");
    }
  });

  it("accepts emiMonthsPaid equal to emiMonthsTotal", () => {
    const result = vehicleSchema.safeParse({ ...baseVehicle, emiMonthsTotal: 10, emiMonthsPaid: 10 });
    expect(result.success).toBe(true);
  });

  it("rejects a negative purchase price", () => {
    const result = vehicleSchema.safeParse({ ...baseVehicle, purchasePriceCents: -1 });
    expect(result.success).toBe(false);
  });
});

const baseTransaction = {
  date: "2026-07-20",
  vehicleId: "CR01",
  category: "Fuel" as const,
  incomeZarCents: 0,
  expenseZarCents: 50000,
  notes: null,
  mileageKm: null,
  photoUrls: [] as string[],
};

describe("transactionSchema", () => {
  it("accepts a well-formed expense transaction", () => {
    expect(transactionSchema.safeParse(baseTransaction).success).toBe(true);
  });

  it("accepts a well-formed income transaction", () => {
    const result = transactionSchema.safeParse({
      ...baseTransaction,
      category: "Income",
      incomeZarCents: 100000,
      expenseZarCents: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects income and expense both zero for a non-Service category", () => {
    const result = transactionSchema.safeParse({ ...baseTransaction, expenseZarCents: 0, incomeZarCents: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts a R0 Service entry — the free/warranty-service exception found during data review", () => {
    const result = transactionSchema.safeParse({
      ...baseTransaction,
      category: "Service",
      incomeZarCents: 0,
      expenseZarCents: 0,
      mileageKm: 90000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects income and expense both greater than zero", () => {
    const result = transactionSchema.safeParse({ ...baseTransaction, incomeZarCents: 5000, expenseZarCents: 5000 });
    expect(result.success).toBe(false);
  });

  it("requires mileageKm when category is Service", () => {
    const result = transactionSchema.safeParse({
      ...baseTransaction,
      category: "Service",
      expenseZarCents: 30000,
      mileageKm: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("mileageKm"))).toBe(true);
    }
  });

  it("does not require mileageKm for non-Service categories", () => {
    const result = transactionSchema.safeParse({ ...baseTransaction, category: "License", expenseZarCents: 5000 });
    expect(result.success).toBe(true);
  });

  it("accepts ALLCR as a vehicleId", () => {
    const result = transactionSchema.safeParse({ ...baseTransaction, vehicleId: "ALLCR" });
    expect(result.success).toBe(true);
  });

  it("accepts a null vehicleId (e.g. a loan repayment)", () => {
    const result = transactionSchema.safeParse({ ...baseTransaction, vehicleId: null, category: "Other" });
    expect(result.success).toBe(true);
  });
});

const baseMileageEntry = {
  date: "2026-07-20",
  vehicleId: "CR01",
  currentMileageKm: 111688,
  photoUrls: [] as string[],
};

describe("mileageEntrySchema", () => {
  it("accepts a well-formed entry", () => {
    expect(mileageEntrySchema.safeParse(baseMileageEntry).success).toBe(true);
  });

  it("rejects a zero current mileage", () => {
    const result = mileageEntrySchema.safeParse({ ...baseMileageEntry, currentMileageKm: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative current mileage", () => {
    const result = mileageEntrySchema.safeParse({ ...baseMileageEntry, currentMileageKm: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects ALLCR as a vehicle for a mileage entry — always a real vehicle", () => {
    const result = mileageEntrySchema.safeParse({ ...baseMileageEntry, vehicleId: "ALLCR" });
    expect(result.success).toBe(false);
  });

  it("has no previousMileageKm field to validate — it's always server-fetched", () => {
    expect("previousMileageKm" in mileageEntrySchema.shape).toBe(false);
  });
});

const baseNote = {
  date: "2026-07-20",
  vehicleId: "CR01" as string | null,
  note: "Driver changed shift pattern this week.",
  photoUrls: [] as string[],
};

describe("vehicleNoteSchema", () => {
  it("accepts a well-formed note", () => {
    expect(vehicleNoteSchema.safeParse(baseNote).success).toBe(true);
  });

  it("rejects an empty note", () => {
    const result = vehicleNoteSchema.safeParse({ ...baseNote, note: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only note", () => {
    const result = vehicleNoteSchema.safeParse({ ...baseNote, note: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts ALLCR for a fleet-wide note", () => {
    const result = vehicleNoteSchema.safeParse({ ...baseNote, vehicleId: "ALLCR" });
    expect(result.success).toBe(true);
  });

  it("accepts a null vehicleId for a note with no specific vehicle", () => {
    const result = vehicleNoteSchema.safeParse({ ...baseNote, vehicleId: null });
    expect(result.success).toBe(true);
  });

  it("imposes no character limit, by design", () => {
    const longNote = "A".repeat(10000);
    const result = vehicleNoteSchema.safeParse({ ...baseNote, note: longNote });
    expect(result.success).toBe(true);
  });
});
