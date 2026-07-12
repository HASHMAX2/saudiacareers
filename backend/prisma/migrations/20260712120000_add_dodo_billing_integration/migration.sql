/*
  Warnings:

  - You are about to drop the column `billingAddress` on the `EmployerProfile` table. All the data in the column will be lost (migrated into `billingAddressLine1` first).
  - Existing `PlanTier` values are relabeled: `STARTER` -> `PROFESSIONAL`, `GROWTH` -> `ENTERPRISE`. A new `STARTER` value is added for a lower-priced entry tier (seeded separately after this migration, since a freshly added enum value cannot be used in the same transaction that adds it).

*/
-- RenameEnumValue
ALTER TYPE "PlanTier" RENAME VALUE 'STARTER' TO 'PROFESSIONAL';
ALTER TYPE "PlanTier" RENAME VALUE 'GROWTH' TO 'ENTERPRISE';
ALTER TYPE "PlanTier" ADD VALUE 'STARTER';

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CHARGE', 'REFUND', 'FAILED_CHARGE');

-- AlterTable: EmployerSubscription gateway linkage
ALTER TABLE "EmployerSubscription" ADD COLUMN     "currentPeriodStart" TIMESTAMP(3);
ALTER TABLE "EmployerSubscription" ADD COLUMN     "gatewayCustomerId" TEXT;
ALTER TABLE "EmployerSubscription" ADD COLUMN     "gatewaySubscriptionId" TEXT;

-- AlterTable: Plan gateway product mapping
ALTER TABLE "Plan" ADD COLUMN     "dodoProductId" TEXT;

-- AlterTable: EmployerProfile structured billing address
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingAddressLine1" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingAddressLine2" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingCity" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingState" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingPostalCode" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN     "billingCountry" TEXT DEFAULT 'SA';

UPDATE "EmployerProfile" SET "billingAddressLine1" = "billingAddress" WHERE "billingAddress" IS NOT NULL;

ALTER TABLE "EmployerProfile" DROP COLUMN "billingAddress";

-- CreateTable
CREATE TABLE "EmployerPaymentMethod" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "gatewayPaymentMethodId" TEXT NOT NULL,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "invoiceId" INTEGER,
    "type" "TransactionType" NOT NULL,
    "amountSar" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "gatewayRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DodoWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DodoWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeUnlockEvent" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeUnlockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployerPaymentMethod_employerProfileId_key" ON "EmployerPaymentMethod"("employerProfileId");

-- CreateIndex
CREATE INDEX "Transaction_employerProfileId_idx" ON "Transaction"("employerProfileId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeUnlockEvent_employerProfileId_applicationId_key" ON "ResumeUnlockEvent"("employerProfileId", "applicationId");

-- CreateIndex
CREATE INDEX "ResumeUnlockEvent_employerProfileId_createdAt_idx" ON "ResumeUnlockEvent"("employerProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmployerPaymentMethod" ADD CONSTRAINT "EmployerPaymentMethod_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeUnlockEvent" ADD CONSTRAINT "ResumeUnlockEvent_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rename existing plan display names to match the new tier labels
UPDATE "Plan" SET "name" = 'Professional' WHERE "tier" = 'PROFESSIONAL';
UPDATE "Plan" SET "name" = 'Enterprise' WHERE "tier" = 'ENTERPRISE';
