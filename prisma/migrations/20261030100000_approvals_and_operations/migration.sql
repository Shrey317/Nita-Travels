CREATE TABLE "ChangeRequest" (
 "id" TEXT PRIMARY KEY, "requestedBy" TEXT NOT NULL, "entity" TEXT NOT NULL,
 "recordId" TEXT NOT NULL, "operation" TEXT NOT NULL, "before" JSONB NOT NULL,
 "proposed" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
 "reviewedBy" TEXT, "reviewNote" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "reviewedAt" TIMESTAMP(3),
 CHECK ("status" IN ('PENDING','APPROVED','REJECTED')),
 CHECK ("operation" IN ('UPDATE','DELETE'))
);
CREATE INDEX "ChangeRequest_status_createdAt_idx" ON "ChangeRequest"("status","createdAt");
CREATE TABLE "FleetDocument" (
 "id" TEXT PRIMARY KEY, "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id"),
 "title" TEXT NOT NULL, "documentType" TEXT NOT NULL, "reference" TEXT,
 "expiryDate" DATE NOT NULL, "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 "archived" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX "FleetDocument_vehicleId_expiryDate_idx" ON "FleetDocument"("vehicleId","expiryDate");
CREATE TABLE "WorkOrder" (
 "id" TEXT PRIMARY KEY, "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id"),
 "kind" TEXT NOT NULL CHECK ("kind" IN ('SERVICE','REPAIR')), "title" TEXT NOT NULL,
 "plannedDate" DATE NOT NULL, "startedDate" DATE, "completedDate" DATE, "notes" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 "archived" BOOLEAN NOT NULL DEFAULT false,
 CHECK ("completedDate" IS NULL OR ("startedDate" IS NOT NULL AND "completedDate" >= "startedDate"))
);
CREATE INDEX "WorkOrder_vehicleId_plannedDate_idx" ON "WorkOrder"("vehicleId","plannedDate");
