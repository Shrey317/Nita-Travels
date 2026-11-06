CREATE TABLE "PasswordReset" (
  "tokenHash" TEXT PRIMARY KEY,
  "staffId" TEXT NOT NULL,
  "sessionVersion" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3)
);
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");
