-- CreateEnum
CREATE TYPE "RepairApprovalStatus" AS ENUM ('QUOTED', 'APPROVED', 'INVOICED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceRecordStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "RtoRepair" ADD COLUMN     "companyPaidDate" DATE,
ADD COLUMN     "quotedDate" DATE,
ADD COLUMN     "status" "RepairApprovalStatus" NOT NULL DEFAULT 'INVOICED',
ALTER COLUMN "approvedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RtoService" ADD COLUMN     "plannedDate" DATE,
ADD COLUMN     "status" "ServiceRecordStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "targetMileageKm" INTEGER;
