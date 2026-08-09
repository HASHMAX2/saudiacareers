-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visionRelevant" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EmployerProfile" ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visionRelevant" BOOLEAN NOT NULL DEFAULT false;
