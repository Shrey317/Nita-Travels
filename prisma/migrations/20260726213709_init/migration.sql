-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Service', 'Fuel', 'Tyres', 'BrakePads', 'Repairs', 'License', 'Maintenance', 'Other', 'UberFees', 'Income');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "registration2" TEXT,
    "transmission" TEXT NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "purchasePriceCents" INTEGER NOT NULL,
    "mileageAtPurchaseKm" INTEGER NOT NULL,
    "currentMileageKm" INTEGER NOT NULL DEFAULT 0,
    "warranty" TEXT,
    "serviceIntervalKm" INTEGER NOT NULL DEFAULT 20000,
    "targetEmiCents" INTEGER NOT NULL DEFAULT 0,
    "emiMonthsTotal" INTEGER NOT NULL DEFAULT 0,
    "emiMonthsPaid" INTEGER NOT NULL DEFAULT 0,
    "insurer" TEXT,
    "policyNumber" TEXT,
    "monthlyPremiumCents" INTEGER NOT NULL DEFAULT 0,
    "insurancePeriodMonths" INTEGER NOT NULL DEFAULT 0,
    "insuranceEndDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "vehicleId" TEXT,
    "category" "Category" NOT NULL,
    "incomeZarCents" INTEGER NOT NULL DEFAULT 0,
    "expenseZarCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "mileageKm" INTEGER,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MileageEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "previousMileageKm" INTEGER NOT NULL,
    "currentMileageKm" INTEGER NOT NULL,
    "distanceDrivenKm" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "weeklyLimitKm" INTEGER NOT NULL DEFAULT 2000,
    "overLimitByKm" INTEGER,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MileageEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleNote" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "vehicleId" TEXT,
    "note" TEXT NOT NULL,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vehicle_active_idx" ON "Vehicle"("active");

-- CreateIndex
CREATE INDEX "Transaction_vehicleId_idx" ON "Transaction"("vehicleId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_category_idx" ON "Transaction"("category");

-- CreateIndex
CREATE INDEX "MileageEntry_vehicleId_idx" ON "MileageEntry"("vehicleId");

-- CreateIndex
CREATE INDEX "MileageEntry_isoYear_isoWeek_idx" ON "MileageEntry"("isoYear", "isoWeek");

-- CreateIndex
CREATE INDEX "VehicleNote_vehicleId_idx" ON "VehicleNote"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleNote_date_idx" ON "VehicleNote"("date");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleNote" ADD CONSTRAINT "VehicleNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
