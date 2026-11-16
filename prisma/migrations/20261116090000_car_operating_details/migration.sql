ALTER TABLE "Vehicle" ADD COLUMN "modelYear" INTEGER, ADD COLUMN "handlerName" TEXT, ADD COLUMN "purchaseCompany" TEXT, ADD COLUMN "fidelityMonthlyCents" INTEGER;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_fidelity_nonnegative" CHECK ("fidelityMonthlyCents" IS NULL OR "fidelityMonthlyCents" >= 0);
UPDATE "Vehicle" v SET "modelYear" = a."modelYear" FROM (SELECT DISTINCT ON ("vehicleId") "vehicleId", "modelYear" FROM "RtoAgreement" ORDER BY "vehicleId", "createdAt" DESC) a WHERE v.id = a."vehicleId" AND v."modelYear" IS NULL;
