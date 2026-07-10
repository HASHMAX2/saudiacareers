-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'REVISION_PENDING_APPROVAL';
ALTER TYPE "JobStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "revisesJobId" INTEGER;

-- CreateIndex
CREATE INDEX "Job_revisesJobId_idx" ON "Job"("revisesJobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_revisesJobId_fkey" FOREIGN KEY ("revisesJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
