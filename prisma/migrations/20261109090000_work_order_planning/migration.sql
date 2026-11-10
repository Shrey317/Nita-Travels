ALTER TABLE "WorkOrder" ADD COLUMN "workshop" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "targetMileageKm" INTEGER;
ALTER TABLE "WorkOrder" ADD COLUMN "expenseTransactionId" TEXT;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_targetMileage_check" CHECK ("targetMileageKm" IS NULL OR "targetMileageKm" >= 0);
