-- Candidate profile: replace fixed 4-city "location" with international Country + City,
-- and clear legacy free-text values for maritalStatus/visaStatus that predate their
-- new fixed dropdown option sets (they cannot be reliably mapped to the new values).

-- 1. Add new columns
ALTER TABLE "CandidateProfile" ADD COLUMN "country" TEXT;
ALTER TABLE "CandidateProfile" ADD COLUMN "city" TEXT;

-- 2. Backfill from the old 4-city enum where the value is a real Saudi city.
--    "Other" (and anything else) cannot be mapped to a real country, so it is left null.
UPDATE "CandidateProfile"
SET "country" = 'Saudi Arabia', "city" = "location"
WHERE "location" IN ('Riyadh', 'Jeddah', 'Dammam');

-- 3. Clear legacy free-text maritalStatus/visaStatus values that predate the new
--    fixed dropdown options and cannot be reliably mapped onto them.
UPDATE "CandidateProfile" SET "maritalStatus" = NULL
WHERE "maritalStatus" IS NOT NULL
  AND "maritalStatus" NOT IN ('Single', 'Married', 'Divorced', 'Separated', 'Widowed', 'Prefer not to say');

UPDATE "CandidateProfile" SET "visaStatus" = NULL
WHERE "visaStatus" IS NOT NULL
  AND "visaStatus" NOT IN (
    'Yes — Saudi citizen',
    'Yes — GCC citizen',
    'Yes — valid Iqama and work permit',
    'Yes — dependent Iqama',
    'No — I require employer sponsorship',
    'Other'
  );

-- 4. Drop the old fixed-city column and its index
DROP INDEX IF EXISTS "CandidateProfile_location_idx";
ALTER TABLE "CandidateProfile" DROP COLUMN "location";

-- 5. Index the new country column (mirrors the old location index)
CREATE INDEX "CandidateProfile_country_idx" ON "CandidateProfile"("country");
