-- CreateEnum
CREATE TYPE "VehicleAvailability" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE', 'DISPOSED');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "availability" "VehicleAvailability" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "RtoMileageEntry" ADD COLUMN     "displayedKm" INTEGER,
ADD COLUMN     "reviewRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RtoDowntime" ADD COLUMN     "replacementReturnedAt" TIMESTAMP(3),
ADD COLUMN     "replacementVehicleId" TEXT;

-- AlterTable
ALTER TABLE "BankFinanceAgreement" ADD COLUMN     "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "VehicleOdometerEvent" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "lifetimeKm" INTEGER NOT NULL,
    "displayedKm" INTEGER NOT NULL,
    "offsetKm" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleOdometerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoMileagePeriod" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "distanceKm" INTEGER NOT NULL,
    "excessKm" INTEGER NOT NULL,
    "evidence" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoMileagePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleOdometerEvent_vehicleId_effectiveDate_key" ON "VehicleOdometerEvent"("vehicleId", "effectiveDate");

-- CreateIndex
CREATE INDEX "RtoMileagePeriod_agreementId_endsAt_idx" ON "RtoMileagePeriod"("agreementId", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "RtoMileagePeriod_agreementId_startsAt_key" ON "RtoMileagePeriod"("agreementId", "startsAt");

-- AddForeignKey
ALTER TABLE "VehicleOdometerEvent" ADD CONSTRAINT "VehicleOdometerEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoMileagePeriod" ADD CONSTRAINT "RtoMileagePeriod_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoDowntime" ADD CONSTRAINT "RtoDowntime_replacementVehicleId_fkey" FOREIGN KEY ("replacementVehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "RtoDowntime_one_open_replacement" ON "RtoDowntime" ("replacementVehicleId") WHERE "replacementVehicleId" IS NOT NULL AND "replacementReturnedAt" IS NULL;
ALTER TABLE "VehicleOdometerEvent" ADD CONSTRAINT "odometer_continuity" CHECK ("lifetimeKm" >= 0 AND "displayedKm" >= 0 AND "offsetKm" >= 0 AND "lifetimeKm" = "displayedKm" + "offsetKm");
ALTER TABLE "RtoMileagePeriod" ADD CONSTRAINT "weekly_period_valid" CHECK ("endsAt" - "startsAt" = 7 AND "distanceKm" >= 0 AND "excessKm" = GREATEST(0, "distanceKm" - 2000));
INSERT INTO "RtoMileagePeriod" (id, "agreementId", "startsAt", "endsAt", "distanceKm", "excessKm", evidence, actor, "createdAt")
SELECT 'legacy-period-' || id, "agreementId", previous_date, date, "distanceKm", "excessKm", source, 'migration', "createdAt"
FROM (SELECT *, lag(date) OVER (PARTITION BY "agreementId" ORDER BY date) AS previous_date FROM "RtoMileageEntry") readings
WHERE date - previous_date = 7;
