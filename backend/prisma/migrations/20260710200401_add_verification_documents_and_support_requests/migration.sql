/*
  Warnings:

  - You are about to drop the column `verificationDocPath` on the `EmployerProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('REGISTRATION_CERTIFICATE', 'TAX_REGISTRATION', 'AUTHORIZED_PERSON_ID', 'ADDRESS_PROOF', 'AUTHORIZATION_LETTER');

-- CreateEnum
CREATE TYPE "SupportRequestCategory" AS ENUM ('VERIFICATION', 'PROFILE', 'DOCUMENTS', 'ACCOUNT', 'OTHER');

-- AlterTable
ALTER TABLE "EmployerProfile" DROP COLUMN "verificationDocPath";

-- CreateTable
CREATE TABLE "EmployerVerificationDocument" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "documentType" "VerificationDocumentType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerSupportRequest" (
    "id" SERIAL NOT NULL,
    "employerProfileId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "category" "SupportRequestCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployerVerificationDocument_employerProfileId_idx" ON "EmployerVerificationDocument"("employerProfileId");

-- CreateIndex
CREATE INDEX "EmployerSupportRequest_employerProfileId_idx" ON "EmployerSupportRequest"("employerProfileId");

-- CreateIndex
CREATE INDEX "EmployerSupportRequest_userId_idx" ON "EmployerSupportRequest"("userId");

-- AddForeignKey
ALTER TABLE "EmployerVerificationDocument" ADD CONSTRAINT "EmployerVerificationDocument_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerSupportRequest" ADD CONSTRAINT "EmployerSupportRequest_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerSupportRequest" ADD CONSTRAINT "EmployerSupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
