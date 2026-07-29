-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "companyProfileId" INTEGER;

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyProfile_name_idx" ON "CompanyProfile"("name");

-- CreateIndex
CREATE INDEX "Job_companyProfileId_idx" ON "Job"("companyProfileId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
