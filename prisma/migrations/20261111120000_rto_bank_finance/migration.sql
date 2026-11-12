-- CreateEnum
CREATE TYPE "OperatingModule" AS ENUM ('NORMAL_RENTAL', 'RENT_TO_OWN', 'UNASSIGNED');

-- CreateEnum
CREATE TYPE "RtoStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'IN_DEFAULT', 'COMPLETED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankFinanceStatus" AS ENUM ('ACTIVE', 'SETTLED', 'REFINANCED');

-- CreateEnum
CREATE TYPE "RtoPaymentKind" AS ENUM ('RENT', 'UPFRONT', 'CHARGE');

-- CreateTable
CREATE TABLE "VehicleAssignment" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "module" "OperatingModule" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleTransfer" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fromModule" "OperatingModule" NOT NULL,
    "toModule" "OperatingModule" NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetAuditEvent" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoDriver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "licenceReference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoAgreement" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "modelYear" INTEGER NOT NULL,
    "status" "RtoStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" DATE NOT NULL,
    "weeks" INTEGER NOT NULL DEFAULT 234,
    "weeklyAmount" DECIMAL(14,2) NOT NULL,
    "upfrontRequired" DECIMAL(14,2) NOT NULL DEFAULT 8000,
    "terms" JSONB NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RtoAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoInstallment" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "originalDueDate" TIMESTAMP(3) NOT NULL,
    "effectiveDueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "RtoInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoPayment" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "kind" "RtoPaymentKind" NOT NULL,
    "reference" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoPaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "installmentId" TEXT,
    "chargeId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoCharge" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoMileageEntry" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "distanceKm" INTEGER NOT NULL,
    "excessKm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoMileageEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoRepair" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workshop" TEXT NOT NULL,
    "quotation" DECIMAL(14,2) NOT NULL,
    "approvedAmount" DECIMAL(14,2) NOT NULL,
    "invoiceAmount" DECIMAL(14,2) NOT NULL,
    "recoveryAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "companyAmount" DECIMAL(14,2) NOT NULL,
    "driverAmount" DECIMAL(14,2) NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoRepair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoService" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "intervalKm" INTEGER NOT NULL DEFAULT 15000,
    "workshop" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoDowntime" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoDowntime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoSettlementReview" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "indicativeAmount" DECIMAL(14,2) NOT NULL,
    "approvedAmount" DECIMAL(14,2),
    "legalBasis" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoSettlementReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RtoDocument" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtoDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankFinanceAgreement" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "originalPrincipal" DECIMAL(14,2) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyAmount" DECIMAL(14,2) NOT NULL,
    "interestRate" DECIMAL(7,4),
    "maturityDate" DATE NOT NULL,
    "status" "BankFinanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankFinanceAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankFinancePayment" (
    "id" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "principal" DECIMAL(14,2),
    "interest" DECIMAL(14,2),
    "fees" DECIMAL(14,2),
    "reference" TEXT NOT NULL,
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankFinancePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankFinanceStatement" (
    "id" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "outstandingPrincipal" DECIMAL(14,2) NOT NULL,
    "arrears" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fees" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "settlementAmount" DECIMAL(14,2),
    "quotationDate" DATE,
    "quotationExpiry" DATE,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankFinanceStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankFinanceAdjustment" (
    "id" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankFinanceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankFinanceDocument" (
    "id" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankFinanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleAssignment_vehicleId_startsAt_idx" ON "VehicleAssignment"("vehicleId", "startsAt");

-- CreateIndex
CREATE INDEX "VehicleTransfer_vehicleId_effectiveAt_idx" ON "VehicleTransfer"("vehicleId", "effectiveAt");

-- CreateIndex
CREATE INDEX "FleetAuditEvent_scope_recordId_createdAt_idx" ON "FleetAuditEvent"("scope", "recordId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RtoAgreement_number_key" ON "RtoAgreement"("number");

-- CreateIndex
CREATE INDEX "RtoAgreement_vehicleId_status_idx" ON "RtoAgreement"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "RtoAgreement_driverId_idx" ON "RtoAgreement"("driverId");

-- CreateIndex
CREATE INDEX "RtoInstallment_effectiveDueDate_idx" ON "RtoInstallment"("effectiveDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RtoInstallment_agreementId_sequence_key" ON "RtoInstallment"("agreementId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "RtoPayment_idempotencyKey_key" ON "RtoPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RtoPayment_agreementId_date_idx" ON "RtoPayment"("agreementId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RtoPayment_agreementId_reference_key" ON "RtoPayment"("agreementId", "reference");

-- CreateIndex
CREATE INDEX "RtoPaymentAllocation_installmentId_idx" ON "RtoPaymentAllocation"("installmentId");

-- CreateIndex
CREATE INDEX "RtoPaymentAllocation_chargeId_idx" ON "RtoPaymentAllocation"("chargeId");

-- CreateIndex
CREATE UNIQUE INDEX "RtoCharge_sourceKey_key" ON "RtoCharge"("sourceKey");

-- CreateIndex
CREATE INDEX "RtoCharge_agreementId_date_idx" ON "RtoCharge"("agreementId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RtoMileageEntry_agreementId_date_key" ON "RtoMileageEntry"("agreementId", "date");

-- CreateIndex
CREATE INDEX "RtoRepair_agreementId_date_idx" ON "RtoRepair"("agreementId", "date");

-- CreateIndex
CREATE INDEX "RtoService_agreementId_date_idx" ON "RtoService"("agreementId", "date");

-- CreateIndex
CREATE INDEX "RtoDowntime_agreementId_startsAt_idx" ON "RtoDowntime"("agreementId", "startsAt");

-- CreateIndex
CREATE INDEX "RtoSettlementReview_agreementId_idx" ON "RtoSettlementReview"("agreementId");

-- CreateIndex
CREATE INDEX "RtoDocument_agreementId_idx" ON "RtoDocument"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "BankFinanceAgreement_reference_key" ON "BankFinanceAgreement"("reference");

-- CreateIndex
CREATE INDEX "BankFinanceAgreement_vehicleId_status_idx" ON "BankFinanceAgreement"("vehicleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BankFinancePayment_idempotencyKey_key" ON "BankFinancePayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BankFinancePayment_financeId_date_idx" ON "BankFinancePayment"("financeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BankFinancePayment_financeId_reference_key" ON "BankFinancePayment"("financeId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "BankFinanceStatement_financeId_date_key" ON "BankFinanceStatement"("financeId", "date");

-- CreateIndex
CREATE INDEX "BankFinanceAdjustment_financeId_date_idx" ON "BankFinanceAdjustment"("financeId", "date");

-- CreateIndex
CREATE INDEX "BankFinanceDocument_financeId_idx" ON "BankFinanceDocument"("financeId");

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTransfer" ADD CONSTRAINT "VehicleTransfer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoAgreement" ADD CONSTRAINT "RtoAgreement_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoAgreement" ADD CONSTRAINT "RtoAgreement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "RtoDriver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoInstallment" ADD CONSTRAINT "RtoInstallment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoPayment" ADD CONSTRAINT "RtoPayment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoPaymentAllocation" ADD CONSTRAINT "RtoPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "RtoPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoPaymentAllocation" ADD CONSTRAINT "RtoPaymentAllocation_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "RtoInstallment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoPaymentAllocation" ADD CONSTRAINT "RtoPaymentAllocation_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "RtoCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoCharge" ADD CONSTRAINT "RtoCharge_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoMileageEntry" ADD CONSTRAINT "RtoMileageEntry_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoRepair" ADD CONSTRAINT "RtoRepair_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoService" ADD CONSTRAINT "RtoService_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoDowntime" ADD CONSTRAINT "RtoDowntime_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoSettlementReview" ADD CONSTRAINT "RtoSettlementReview_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RtoDocument" ADD CONSTRAINT "RtoDocument_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "RtoAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinanceAgreement" ADD CONSTRAINT "BankFinanceAgreement_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinancePayment" ADD CONSTRAINT "BankFinancePayment_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "BankFinanceAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinanceStatement" ADD CONSTRAINT "BankFinanceStatement_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "BankFinanceAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinanceAdjustment" ADD CONSTRAINT "BankFinanceAdjustment_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "BankFinanceAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinanceDocument" ADD CONSTRAINT "BankFinanceDocument_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "BankFinanceAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve legacy identity/history and establish an initial operational assignment.
ALTER TABLE "BankFinanceAgreement" ADD COLUMN "firstDueDate" DATE;
INSERT INTO "VehicleAssignment" ("id", "vehicleId", "module", "startsAt")
SELECT 'legacy-rental-' || "id", "id", 'NORMAL_RENTAL', "purchaseDate" FROM "Vehicle";
CREATE UNIQUE INDEX "VehicleAssignment_one_open" ON "VehicleAssignment" ("vehicleId") WHERE "endsAt" IS NULL;
CREATE UNIQUE INDEX "RtoAgreement_one_operational" ON "RtoAgreement" ("vehicleId") WHERE "status" IN ('ACTIVE', 'SUSPENDED', 'IN_DEFAULT');
CREATE UNIQUE INDEX "BankFinanceAgreement_one_active" ON "BankFinanceAgreement" ("vehicleId") WHERE "status" = 'ACTIVE';
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "assignment_dates" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "RtoAgreement" ADD CONSTRAINT "rto_terms_positive" CHECK ("weeks" > 0 AND "weeklyAmount" > 0 AND "upfrontRequired" >= 0);
ALTER TABLE "RtoInstallment" ADD CONSTRAINT "installment_positive" CHECK ("amount" > 0 AND "sequence" > 0);
ALTER TABLE "RtoPayment" ADD CONSTRAINT "rto_payment_positive" CHECK ("amount" > 0);
ALTER TABLE "RtoPaymentAllocation" ADD CONSTRAINT "allocation_target" CHECK (("installmentId" IS NULL) <> ("chargeId" IS NULL));
ALTER TABLE "RtoPaymentAllocation" ADD CONSTRAINT "allocation_positive" CHECK ("amount" > 0);
ALTER TABLE "RtoCharge" ADD CONSTRAINT "charge_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "RtoDowntime" ADD CONSTRAINT "downtime_dates" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "RtoRepair" ADD CONSTRAINT "repair_reconciliation" CHECK ("invoiceAmount" >= 0 AND "recoveryAmount" >= 0 AND "driverAmount" >= 0 AND "companyAmount" >= 0 AND "driverAmount" + "companyAmount" + "recoveryAmount" = "invoiceAmount");
ALTER TABLE "BankFinancePayment" ADD CONSTRAINT "bank_payment_components" CHECK ("amount" > 0 AND COALESCE("principal",0) >= 0 AND COALESCE("interest",0) >= 0 AND COALESCE("fees",0) >= 0 AND COALESCE("principal",0) + COALESCE("interest",0) + COALESCE("fees",0) <= "amount");
ALTER TABLE "BankFinanceStatement" ADD CONSTRAINT "bank_statement_nonnegative" CHECK ("outstandingPrincipal" >= 0 AND "arrears" >= 0 AND "fees" >= 0 AND ("settlementAmount" IS NULL OR "settlementAmount" >= 0));
