-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "availabilityToJoin" TEXT,
ADD COLUMN     "currentSalary" TEXT,
ADD COLUMN     "cvHeadline" TEXT,
ADD COLUMN     "desiredJobTitle" TEXT,
ADD COLUMN     "desiredLocation" TEXT,
ADD COLUMN     "functionalArea" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "itSkills" TEXT,
ADD COLUMN     "linkedInUrl" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "portfolioUrl" TEXT;

-- CreateTable
CREATE TABLE "EmploymentEntry" (
    "id" SERIAL NOT NULL,
    "candidateProfileId" INTEGER NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER NOT NULL,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationEntry" (
    "id" SERIAL NOT NULL,
    "candidateProfileId" INTEGER NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" SERIAL NOT NULL,
    "candidateProfileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrg" TEXT,
    "issueYear" INTEGER,
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmploymentEntry_candidateProfileId_idx" ON "EmploymentEntry"("candidateProfileId");

-- CreateIndex
CREATE INDEX "EducationEntry_candidateProfileId_idx" ON "EducationEntry"("candidateProfileId");

-- CreateIndex
CREATE INDEX "Certification_candidateProfileId_idx" ON "Certification"("candidateProfileId");

-- AddForeignKey
ALTER TABLE "EmploymentEntry" ADD CONSTRAINT "EmploymentEntry_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
