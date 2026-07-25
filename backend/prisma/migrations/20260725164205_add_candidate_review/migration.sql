-- CreateTable
CREATE TABLE "CandidateReview" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "adminComments" TEXT,
    "aiScore" INTEGER,
    "aiScoreNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "profileUpdatedAtSnapshot" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateReview_candidateId_key" ON "CandidateReview"("candidateId");

-- AddForeignKey
ALTER TABLE "CandidateReview" ADD CONSTRAINT "CandidateReview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
