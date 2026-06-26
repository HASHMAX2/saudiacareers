import { prisma } from "../config/prisma.js";
import { sendEmail } from "../services/emailService.js";
import { applicationStatusEmailTemplate } from "../services/emailTemplates/applicationStatus.js";
import { createSignedDownloadUrl } from "../services/storageService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getEmployerProfile(req, res) {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile) throw new ApiError(404, "Employer profile not found");
  return sendSuccess(res, { message: "Profile retrieved", data: profile });
}

export async function updateEmployerProfile(req, res) {
  const profile = await prisma.employerProfile.update({
    where: { userId: req.user.id },
    data: req.validated.body,
  });
  return sendSuccess(res, { message: "Profile updated", data: profile });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getEmployerDashboard(req, res) {
  const userId = req.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalJobs, activeJobs, totalApplications, newApplications] =
    await prisma.$transaction([
      prisma.job.count({ where: { createdBy: userId, isDeleted: false } }),
      prisma.job.count({ where: { createdBy: userId, isDeleted: false, status: "ACTIVE" } }),
      prisma.application.count({ where: { job: { createdBy: userId } } }),
      prisma.application.count({
        where: { job: { createdBy: userId }, appliedAt: { gte: sevenDaysAgo } },
      }),
    ]);

  return sendSuccess(res, {
    message: "Dashboard metrics retrieved",
    data: { totalJobs, activeJobs, totalApplications, newApplications },
  });
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function listEmployerJobs(req, res) {
  const userId = req.user.id;
  const { page, limit, search, status } = req.validated.query;

  const where = {
    createdBy: userId,
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { applications: true } } },
    }),
    prisma.job.count({ where }),
  ]);

  return sendSuccess(res, {
    message: "Jobs retrieved",
    data: { jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function createEmployerJob(req, res) {
  const { status: _ignored, ...jobData } = req.validated.body;
  const job = await prisma.job.create({
    data: { ...jobData, createdBy: req.user.id, status: "ACTIVE" },
  });
  return sendSuccess(res, { statusCode: 201, message: "Job created", data: job });
}

export async function updateEmployerJob(req, res) {
  const { id } = req.validated.params;
  const existing = await prisma.job.findFirst({
    where: { id, createdBy: req.user.id, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, "Job not found");

  const { status: _ignored, ...jobData } = req.validated.body;
  const job = await prisma.job.update({ where: { id }, data: jobData });
  return sendSuccess(res, { message: "Job updated", data: job });
}

export async function updateEmployerJobStatus(req, res) {
  const { id } = req.validated.params;
  const result = await prisma.job.updateMany({
    where: { id, createdBy: req.user.id, isDeleted: false },
    data: { status: req.validated.body.status },
  });
  if (!result.count) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job status updated" });
}

export async function deleteEmployerJob(req, res) {
  const { id } = req.validated.params;
  const result = await prisma.job.updateMany({
    where: { id, createdBy: req.user.id, isDeleted: false },
    data: { isDeleted: true, status: "INACTIVE" },
  });
  if (!result.count) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job deleted" });
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function listJobApplications(req, res) {
  const { jobId } = req.validated.params;
  const { page, limit, search, status } = req.validated.query;

  const job = await prisma.job.findFirst({
    where: { id: jobId, createdBy: req.user.id, isDeleted: false },
    select: { id: true, title: true },
  });
  if (!job) throw new ApiError(404, "Job not found");

  const where = {
    jobId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [applications, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      include: { user: { include: { profile: true } } },
      orderBy: { appliedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return sendSuccess(res, {
    message: "Applications retrieved",
    data: {
      job,
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
}

export async function updateApplicationStatus(req, res) {
  const { id } = req.validated.params;

  // Only allow status changes for applications on the employer's own jobs
  const application = await prisma.application.findFirst({
    where: { id, job: { createdBy: req.user.id } },
    include: { user: true, job: true },
  });
  if (!application) throw new ApiError(404, "Application not found");

  const updated = await prisma.application.update({
    where: { id },
    data: { status: req.validated.body.status },
    include: { user: true, job: true },
  });

  const template = applicationStatusEmailTemplate({
    name: updated.user.name,
    jobTitle: updated.job.title,
    status: updated.status,
  });
  sendEmail({ to: updated.user.email, ...template }).catch((error) =>
    console.error("Status email failed:", error.message),
  );

  return sendSuccess(res, { message: "Application status updated", data: updated });
}

export async function getApplicationDetail(req, res) {
  const { id } = req.validated.params;
  const application = await prisma.application.findFirst({
    where: { id, job: { createdBy: req.user.id } },
    include: { user: { include: { profile: true } }, job: true },
  });
  if (!application) throw new ApiError(404, "Application not found");

  let resumeUrl = null;
  if (application.user.profile?.resumePath) {
    resumeUrl = await createSignedDownloadUrl(application.user.profile.resumePath);
  }

  return sendSuccess(res, { message: "Application retrieved", data: { ...application, resumeUrl } });
}
