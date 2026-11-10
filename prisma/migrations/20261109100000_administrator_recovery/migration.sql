ALTER TABLE "PasswordReset" ADD COLUMN "principalType" TEXT NOT NULL DEFAULT 'STAFF';
CREATE TABLE "AdministratorCredential" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  "emailVerifiedAt" TIMESTAMP(3)
);
