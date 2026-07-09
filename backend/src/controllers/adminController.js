import { prisma } from "../config/prisma.js";
import { sendEmail } from "../services/emailService.js";
import { applicationStatusEmailTemplate } from "../services/emailTemplates/applicationStatus.js";
import { createSignedDownloadUrl } from "../services/storageService.js";
import { consumeJobCredit, getOrCreateSubscription } from "../services/employerBillingService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const applicationInclude = {
  user: { include: { profile: true } },
  job: true,
};

function applicationWhere(query) {
  return {
    ...(query.jobId ? { jobId: query.jobId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.hrEmailStatus ? { hrEmailStatus: query.hrEmailStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { user: { name: { contains: query.search, mode: "insensitive" } } },
            { job: { title: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function dashboard(req, res) {
  const [jobs, activeJobs, applications, candidates] = await prisma.$transaction([
    prisma.job.count({ where: { isDeleted: false } }),
    prisma.job.count({ where: { isDeleted: false, status: "ACTIVE" } }),
    prisma.application.count(),
    prisma.user.count({ where: { role: "CANDIDATE" } }),
  ]);
  return sendSuccess(res, {
    message: "Dashboard metrics retrieved",
    data: { jobs, activeJobs, applications, candidates },
  });
}

export async function listAdminJobs(req, res) {
  const { page, limit, search, status } = req.validated.query;
  const where = {
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

export async function createJob(req, res) {
  const job = await prisma.job.create({
    data: { ...req.validated.body, createdBy: req.user.id },
  });
  return sendSuccess(res, { statusCode: 201, message: "Job created", data: job });
}

export async function getAdminJob(req, res) {
  const job = await prisma.job.findFirst({
    where: { id: req.validated.params.id, isDeleted: false },
  });
  if (!job) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job retrieved", data: job });
}

export async function updateJob(req, res) {
  const existing = await prisma.job.findFirst({
    where: { id: req.validated.params.id, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, "Job not found");
  const job = await prisma.job.update({
    where: { id: existing.id },
    data: req.validated.body,
  });
  return sendSuccess(res, { message: "Job updated", data: job });
}

export async function deleteJob(req, res) {
  const result = await prisma.job.updateMany({
    where: { id: req.validated.params.id, isDeleted: false },
    data: { isDeleted: true, status: "INACTIVE" },
  });
  if (!result.count) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job deleted" });
}

export async function updateJobStatus(req, res) {
  const result = await prisma.job.updateMany({
    where: { id: req.validated.params.id, isDeleted: false },
    data: { status: req.validated.body.status },
  });
  if (!result.count) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job status updated" });
}

export async function approveJobReview(req, res) {
  const { id } = req.validated.params;
  const job = await prisma.job.findFirst({ where: { id, isDeleted: false } });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "PENDING_REVIEW") throw new ApiError(400, "Only jobs pending review can be approved");

  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: job.createdBy } });
  if (!employerProfile) throw new ApiError(404, "Employer profile not found");
  if (employerProfile.verificationStatus !== "APPROVED") {
    throw new ApiError(403, "Cannot approve — the employer's company verification is not approved");
  }

  const subscription = await getOrCreateSubscription(employerProfile.id);
  const creditSource = await consumeJobCredit(subscription);
  const expiresAt = new Date(Date.now() + job.listingDurationDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.job.update({
    where: { id },
    data: { status: "ACTIVE", creditSource, expiresAt, reviewNote: req.validated.body.note || null },
  });
  return sendSuccess(res, { message: "Job approved and published", data: updated });
}

export async function rejectJobReview(req, res) {
  const { id } = req.validated.params;
  const result = await prisma.job.updateMany({
    where: { id, isDeleted: false, status: "PENDING_REVIEW" },
    data: { status: "INACTIVE", reviewNote: req.validated.body.note },
  });
  if (!result.count) throw new ApiError(404, "Job not found or not pending review");
  return sendSuccess(res, { message: "Job rejected" });
}

export async function listFlaggedJobs(req, res) {
  const jobs = await prisma.job.findMany({
    where: { isDeleted: false, reports: { some: {} } },
    include: {
      reports: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { reports: true } },
    },
    orderBy: { reports: { _count: "desc" } },
  });
  return sendSuccess(res, { message: "Flagged jobs retrieved", data: jobs });
}

export async function dismissJobReports(req, res) {
  const { id } = req.validated.params;
  const job = await prisma.job.findFirst({ where: { id, isDeleted: false } });
  if (!job) throw new ApiError(404, "Job not found");

  await prisma.jobReport.deleteMany({ where: { jobId: id } });
  return sendSuccess(res, { message: "Reports dismissed — no action taken on this job" });
}

export async function listApplications(req, res) {
  const { page, limit } = req.validated.query;
  const where = applicationWhere(req.validated.query);
  const [applications, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { appliedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);
  return sendSuccess(res, {
    message: "Applications retrieved",
    data: { applications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function getApplication(req, res) {
  const application = await prisma.application.findUnique({
    where: { id: req.validated.params.id },
    include: applicationInclude,
  });
  if (!application) throw new ApiError(404, "Application not found");
  let resumeUrl = null;
  if (application.user.profile?.resumePath) {
    resumeUrl = await createSignedDownloadUrl(application.user.profile.resumePath);
  }
  return sendSuccess(res, {
    message: "Application retrieved",
    data: { ...application, resumeUrl },
  });
}

export async function updateApplicationStatus(req, res) {
  const application = await prisma.application.update({
    where: { id: req.validated.params.id },
    data: { status: req.validated.body.status },
    include: applicationInclude,
  }).catch(() => null);
  if (!application) throw new ApiError(404, "Application not found");
  const template = applicationStatusEmailTemplate({
    name: application.user.name,
    jobTitle: application.job.title,
    status: application.status,
  });
  sendEmail({ to: application.user.email, ...template }).catch((error) =>
    console.error("Status email failed:", error.message),
  );
  return sendSuccess(res, { message: "Application status updated", data: application });
}

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function exportApplications(req, res) {
  const applications = await prisma.application.findMany({
    where: applicationWhere(req.validated.query),
    include: applicationInclude,
    orderBy: { appliedAt: "desc" },
  });
  const rows = [
    ["Candidate", "Email", "Mobile", "Job", "Company", "Applied At", "Status", "HR Email Status"],
    ...applications.map((item) => [
      item.user.name,
      item.user.email,
      item.user.mobile,
      item.job.title,
      item.job.companyName,
      item.appliedAt.toISOString(),
      item.status,
      item.hrEmailStatus,
    ]),
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="applications.csv"');
  return res.send(rows.map((row) => row.map(csvEscape).join(",")).join("\n"));
}
