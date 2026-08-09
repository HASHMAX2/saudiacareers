import { JobStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { JOB_CARD_SELECT, serializeJobCard } from "./jobController.js";
import { expireOverdueJobs } from "../services/jobExpiryService.js";
import { createSignedDownloadUrl } from "../services/storageService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const OPEN_JOBS_WHERE = {
  status: JobStatus.ACTIVE,
  isDeleted: false,
};

function openJobsWhere(now) {
  return { ...OPEN_JOBS_WHERE, OR: [{ applicationDeadline: null }, { applicationDeadline: { gt: now } }] };
}

// Public company profile page — resolves against whichever of the two
// company-shaped tables the id belongs to. `type` disambiguates because
// EmployerProfile and CompanyProfile each auto-increment their own `id`
// independently, so the same number means two different rows.
export async function getCompanyProfile(req, res) {
  await expireOverdueJobs();
  const { type, id } = req.validated.params;
  const now = new Date();

  if (type === "employer") {
    const profile = await prisma.employerProfile.findUnique({ where: { id } });
    if (!profile) throw new ApiError(404, "Company not found");

    const [jobs, openJobsCount] = await Promise.all([
      prisma.job.findMany({
        where: { ...openJobsWhere(now), createdBy: profile.userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: JOB_CARD_SELECT,
      }),
      prisma.job.count({ where: { ...openJobsWhere(now), createdBy: profile.userId } }),
    ]);

    return sendSuccess(res, {
      message: "Company profile retrieved",
      data: {
        type,
        id: profile.id,
        companyName: profile.companyName,
        industry: profile.industry,
        location: profile.location,
        description: profile.description,
        website: profile.website,
        linkedinUrl: profile.linkedinUrl,
        companySize: profile.companySize,
        foundedYear: profile.foundedYear,
        visionRelevant: profile.visionRelevant,
        verified: profile.verificationStatus === "APPROVED",
        perks: profile.perks,
        logoUrl: profile.logoPath ? await createSignedDownloadUrl(profile.logoPath) : null,
        coverImageUrl: profile.coverImagePath ? await createSignedDownloadUrl(profile.coverImagePath) : null,
        openJobsCount,
        jobs: jobs.map(serializeJobCard),
      },
    });
  }

  // type === "lead"
  const profile = await prisma.companyProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Company not found");

  const [jobs, openJobsCount] = await Promise.all([
    prisma.job.findMany({
      where: { ...openJobsWhere(now), companyProfileId: profile.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: JOB_CARD_SELECT,
    }),
    prisma.job.count({ where: { ...openJobsWhere(now), companyProfileId: profile.id } }),
  ]);

  return sendSuccess(res, {
    message: "Company profile retrieved",
    data: {
      type,
      id: profile.id,
      companyName: profile.name,
      industry: profile.industry,
      location: profile.location,
      description: profile.description,
      website: profile.website,
      linkedinUrl: null,
      companySize: profile.companySize,
      foundedYear: profile.foundedYear,
      visionRelevant: profile.visionRelevant,
      verified: false,
      perks: profile.perks,
      logoUrl: profile.logoPath ? await createSignedDownloadUrl(profile.logoPath) : null,
      coverImageUrl: profile.coverImagePath ? await createSignedDownloadUrl(profile.coverImagePath) : null,
      openJobsCount,
      jobs: jobs.map(serializeJobCard),
    },
  });
}
