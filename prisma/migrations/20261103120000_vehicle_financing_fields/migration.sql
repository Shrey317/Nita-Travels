-- Additive migration: add vehicle financing fields without modifying or dropping any existing data
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "purchaseType" TEXT NOT NULL DEFAULT 'Cash';
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "financeBank" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "financePolicyNumber" TEXT;

-- Mark existing vehicles that already have financing terms configured as Financed
UPDATE "Vehicle"
SET "purchaseType" = 'Financed'
WHERE "emiMonthsTotal" > 0 OR "targetEmiCents" > 0;

