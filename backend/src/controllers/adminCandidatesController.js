import { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { calculateAIScore } from "../services/candidateScoringService.js";
import { candidateFeedbackEmailTemplate } from "../services/emailTemplates/candidateFeedback.js";
import { sendEmail } from "../services/emailService.js";
import { notify } from "../services/notificationService.js";
import { createSignedDownloadUrl } from "../services/storageService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const profileInclude = {
  profile: {
    include: {
      employmentEntries: { orderBy: { startYear: "desc" } },
      educationEntries: { orderBy: [{ isCurrent: "desc" }, { endYear: "desc" }] },
      certifications: { orderBy: { issueYear: "desc" } },
    },
  },
  candidateReview: true,
};

export async function listCandidates(req, res) {
  const { page, limit, search } = req.validated.query;

  const where = {
    role: Role.CANDIDATE,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { profile: { designation: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [candidates, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: profileInclude,
      omit: { passwordHash: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return sendSuccess(res, {
    message: "Candidates retrieved",
    data: { candidates, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function getCandidate(req, res) {
  const { id } = req.validated.params;
  const candidate = await prisma.user.findFirst({
    where: { id, role: Role.CANDIDATE },
    include: profileInclude,
    omit: { passwordHash: true },
  });
  if (!candidate) throw new ApiError(404, "Candidate not found");
  let resumeUrl = null;
  if (candidate.profile?.resumePath) {
    resumeUrl = await createSignedDownloadUrl(candidate.profile.resumePath);
  }
  return sendSuccess(res, { message: "Candidate retrieved", data: { ...candidate, resumeUrl } });
}

export async function sendCandidateFeedback(req, res) {
  const { id } = req.validated.params;
  const { comments } = req.validated.body;

  const candidate = await prisma.user.findFirst({
    where: { id, role: Role.CANDIDATE },
    include: { profile: true },
  });
  if (!candidate) throw new ApiError(404, "Candidate not found");

  const now = new Date();
  const review = await prisma.candidateReview.upsert({
    where: { candidateId: id },
    create: { candidateId: id, adminComments: comments, sentAt: now, profileUpdatedAtSnapshot: candidate.profile?.updatedAt ?? null },
    update: { adminComments: comments, sentAt: now, profileUpdatedAtSnapshot: candidate.profile?.updatedAt ?? null },
  });

  const template = candidateFeedbackEmailTemplate({
    name: candidate.name,
    comments,
    profileUrl: `${env.FRONTEND_URL}/dashboard/profile`,
  });
  sendEmail({ to: candidate.email, ...template }).catch((error) =>
    console.error("Candidate feedback email failed:", error.message),
  );
  await notify({
    userId: candidate.id,
    type: "ADMIN_PROFILE_FEEDBACK",
    title: "Feedback on your profile",
    message: comments,
    link: "/dashboard/profile",
  });

  return sendSuccess(res, { message: "Feedback sent", data: review });
}

export async function calculateCandidateAIScore(req, res) {
  const { id } = req.validated.params;
  const candidate = await prisma.user.findFirst({ where: { id, role: Role.CANDIDATE } });
  if (!candidate) throw new ApiError(404, "Candidate not found");

  const { score, notes } = await calculateAIScore(id);
  const review = await prisma.candidateReview.upsert({
    where: { candidateId: id },
    create: { candidateId: id, aiScore: score, aiScoreNotes: notes },
    update: { aiScore: score, aiScoreNotes: notes },
  });

  return sendSuccess(res, { message: "AI score calculated", data: review });
}
