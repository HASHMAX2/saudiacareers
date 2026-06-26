-- AlterEnum: Add EMPLOYER to Role
ALTER TYPE "Role" ADD VALUE 'EMPLOYER';

-- AlterEnum: Add SHORTLISTED and ON_HOLD to ApplicationStatus
ALTER TYPE "ApplicationStatus" ADD VALUE 'SHORTLISTED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'ON_HOLD';

-- CreateTable EmployerProfile
CREATE TABLE "EmployerProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "logoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");
CREATE INDEX "EmployerProfile_companyName_idx" ON "EmployerProfile"("companyName");

ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable Enquiry
CREATE TABLE "Enquiry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
