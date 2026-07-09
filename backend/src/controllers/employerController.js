import crypto from "node:crypto";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import { sendEmail } from "../services/emailService.js";
import { applicationStatusEmailTemplate } from "../services/emailTemplates/applicationStatus.js";
import { createSignedDownloadUrl, uploadPrivateFile } from "../services/storageService.js";
import { consumeJobCredit, getOrCreateSubscription } from "../services/employerBillingService.js";
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

// ── Verification ──────────────────────────────────────────────────────────────

export async function getVerification(req, res) {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: req.user.id },
    select: { verificationStatus: true, verificationNote: true, verifiedAt: true, verificationDocPath: true },
  });
  if (!profile) throw new ApiError(404, "Employer profile not found");
  return sendSuccess(res, {
    message: "Verification status retrieved",
    data: { ...profile, hasDocument: !!profile.verificationDocPath },
  });
}

export async function submitVerificationDocument(req, res) {
  if (!req.file) throw new ApiError(422, "Verification document is required");
  const profile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const extension = path.extname(req.file.originalname).toLowerCase() || ".pdf";
  const docPath = `employer-verification/${profile.id}/${crypto.randomUUID()}${extension}`;
  await uploadPrivateFile(docPath, req.file.buffer, req.file.mimetype);

  const updated = await prisma.employerProfile.update({
    where: { userId: req.user.id },
    data: {
      verificationDocPath: docPath,
      verificationStatus: "PENDING",
      verificationNote: null,
      verifiedAt: null,
    },
  });

  return sendSuccess(res, {
    message: "Verification document submitted — our team will review it shortly",
    data: { verificationStatus: updated.verificationStatus },
  });
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
  const { status: _ignored, saveAsDraft, ...jobData } = req.validated.body;

  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  if (!employerProfile) throw new ApiError(404, "Employer profile not found");

  if (saveAsDraft) {
    const job = await prisma.job.create({
      data: { ...jobData, createdBy: req.user.id, status: "DRAFT" },
    });
    return sendSuccess(res, { statusCode: 201, message: "Job saved as a draft", data: job });
  }

  if (employerProfile.verificationStatus !== "APPROVED") {
    const job = await prisma.job.create({
      data: { ...jobData, createdBy: req.user.id, status: "DRAFT" },
    });
    return sendSuccess(res, {
      statusCode: 201,
      message: "Job saved as a draft — publishing unlocks once company verification is approved",
      data: job,
    });
  }

  const subscription = await getOrCreateSubscription(employerProfile.id);
  const creditSource = await consumeJobCredit(subscription);
  const listingDurationDays = jobData.listingDurationDays ?? 30;
  const expiresAt = new Date(Date.now() + listingDurationDays * 24 * 60 * 60 * 1000);

  const job = await prisma.job.create({
    data: { ...jobData, createdBy: req.user.id, status: "ACTIVE", creditSource, expiresAt },
  });
  return sendSuccess(res, { statusCode: 201, message: "Job published", data: job });
}

export async function updateEmployerJob(req, res) {
  const { id } = req.validated.params;
  const existing = await prisma.job.findFirst({
    where: { id, createdBy: req.user.id, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, "Job not found");

  const { status: _ignored, saveAsDraft: _ignoredDraft, ...jobData } = req.validated.body;
  const job = await prisma.job.update({ where: { id }, data: jobData });
  return sendSuccess(res, { message: "Job updated", data: job });
}

export async function updateEmployerJobStatus(req, res) {
  const { id } = req.validated.params;
  const { status: nextStatus } = req.validated.body;

  const job = await prisma.job.findFirst({ where: { id, createdBy: req.user.id, isDeleted: false } });
  if (!job) throw new ApiError(404, "Job not found");

  // Publishing (moving into ACTIVE from a non-active state) is gated by
  // verification + job credits, same as creating a brand-new job.
  if (nextStatus === "ACTIVE" && job.status !== "ACTIVE") {
    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
    if (!employerProfile) throw new ApiError(404, "Employer profile not found");
    if (employerProfile.verificationStatus !== "APPROVED") {
      throw new ApiError(403, "Publishing is locked until company verification is approved");
    }

    const subscription = await getOrCreateSubscription(employerProfile.id);
    const creditSource = await consumeJobCredit(subscription);
    const expiresAt = new Date(Date.now() + job.listingDurationDays * 24 * 60 * 60 * 1000);

    await prisma.job.update({
      where: { id },
      data: { status: "ACTIVE", creditSource, expiresAt },
    });
    return sendSuccess(res, { message: "Job published" });
  }

  await prisma.job.update({ where: { id }, data: { status: nextStatus } });
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
