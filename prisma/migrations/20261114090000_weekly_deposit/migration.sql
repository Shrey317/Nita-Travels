-- Existing UPFRONT receipts are retained as deposit payments.
ALTER TYPE "RtoPaymentKind" ADD VALUE 'WEEKLY';
ALTER TABLE "RtoPayment" ADD COLUMN "depositAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "RtoPayment" ADD CONSTRAINT "RtoPayment_deposit_amount_check"
  CHECK ("depositAmount" >= 0 AND "depositAmount" <= "amount");

-- Log the owner's requested plan change without rewriting contracts or receipts.
INSERT INTO "FleetAuditEvent" ("id", "scope", "recordId", "action", "actor", "detail")
SELECT 'weekly-deposit-20261114-' || "id", 'RTO', "id", 'DEPOSIT_PLAN_UPDATED', 'migration:20261114090000',
  jsonb_build_object('weeklyDeposit', '650.00', 'startsWith', 'first weekly rent', 'priorPaymentsPreserved', true, 'totalDeposit', "upfrontRequired"::text)
FROM "RtoAgreement"
ON CONFLICT ("id") DO NOTHING;
