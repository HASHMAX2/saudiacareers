-- CreateEnum
CREATE TYPE "ApplyMethod" AS ENUM ('PLATFORM', 'EXTERNAL_URL', 'EMAIL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SUBSCRIPTION', 'CREDIT_PACK', 'REFUND');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'REFUND_REQUESTED', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'DRAFT';
ALTER TYPE "JobStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "taxRegistrationNumber" TEXT,
ADD COLUMN     "verificationDocPath" TEXT,
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "applyContact" TEXT,
ADD COLUMN     "applyMethod" "ApplyMethod" NOT NULL DEFAULT 'PLATFORM',
ADD COLUMN     "creditSource" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listingDurationDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "screeningQuestion" TEXT,
ADD COLUMN     "workMode" TEXT;

-- CreateTable
CREATE TABLE "EmployerSubscription" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "paidCreditsRemaining" INTEGER NOT NULL DEFAULT 0,
    "freeJobUsedAt" TIMESTAMP(3),
    "renewsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "amountSar" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayRef" TEXT,
    "note" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployerSubscription_employerProfileId_key" ON "EmployerSubscription"("employerProfileId");

-- CreateIndex
CREATE INDEX "Invoice_employerProfileId_idx" ON "Invoice"("employerProfileId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- AddForeignKey
ALTER TABLE "EmployerSubscription" ADD CONSTRAINT "EmployerSubscription_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
