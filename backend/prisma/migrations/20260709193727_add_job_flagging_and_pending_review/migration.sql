-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "flagReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reviewNote" TEXT;
