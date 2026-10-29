CREATE TABLE "StaffAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StaffAccount_status_check" CHECK ("status" IN ('PENDING', 'ACTIVE', 'DISABLED'))
);
CREATE UNIQUE INDEX "StaffAccount_email_key" ON "StaffAccount"("email");
