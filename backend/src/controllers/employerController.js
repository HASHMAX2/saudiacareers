import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { sendEmail } from "../services/emailService.js";
import { applicationStatusEmailTemplate } from "../services/emailTemplates/applicationStatus.js";
import { employerSupportRequestEmailTemplate } from "../services/emailTemplates/employerSupportRequest.js";
import { createSignedDownloadUrl, removePrivateFile, uploadPrivateFile } from "../services/storageService.js";
import { isPdfBuffer } from "../utils/fileSignature.js";
import { env } from "../config/env.js";
import { consumeJobCredit, getOrCreateSubscription } from "../services/employerBillingService.js";
import { checkJobLegitimacy } from "../services/jobLegitimacyService.js";
import { expireOverdueJobs } from "../services/jobExpiryService.js";
import { notify, notifyAdmins, notifyJobClosedForCandidates } from "../services/notificationService.js";
import { pickRevisableFields } from "../utils/jobFields.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const PENDING_STATUSES = ["PENDING_REVIEW", "REVISION_PENDING_APPROVAL"];
const PENDING_REVIEW_MESSAGE = "Pending review jobs can only be managed through the Job Review workflow.";

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getEmployerProfile(req, res) {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile) throw new ApiError(404, "Employer profile not found");
  return sendSuccess(res, { message: "Profile retrieved", data: profile });
}

export async function updateEmployerProfile(req, res) {
  const existing = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  const profile = await prisma.employerProfile.update({
    where: { userId: req.user.id },
    data: req.validated.body,
  });
  if (existing?.verificationStatus === "REJECTED") {
    await notifyAdmins({
      type: "EMPLOYER_UPDATED_AFTER_REJECTION",
      title: "Company details updated after rejection",
      message: `${profile.companyName} updated their company details after a rejected verification — review again.`,
      link: `/admin/verifications`,
    });
  }
  return sendSuccess(res, { message: "Profile updated", data: profile });
}

// ── Verification ──────────────────────────────────────────────────────────────

export async function getVerification(req, res) {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: req.user.id },
    select: {
      verificationStatus: true,
      verificationNote: true,
      verifiedAt: true,
      verificationSubmittedAt: true,
      verificationDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const documents = await Promise.all(
    profile.verificationDocuments.map(async (doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      createdAt: doc.createdAt,
      // Forced download, not inline view (SA-04) — an unverified employer's
      // upload isn't guaranteed to actually be the PDF it claims to be, and
      // this URL is opened directly by the employer's own browser.
      viewUrl: await createSignedDownloadUrl(doc.filePath),
    })),
  );

  return sendSuccess(res, {
    message: "Verification status retrieved",
    data: { ...profile, verificationDocuments: undefined, documents, hasDocument: documents.length > 0 },
  });
}

// PENDING covers both "never submitted" and "submitted, awaiting admin
// review" — only the latter should block further document changes. Mirrors
// the same distinction the frontend uses to lock its form.
function isAwaitingReview(profile) {
  return profile.verificationStatus === "PENDING" && !!profile.verificationSubmittedAt;
}

export async function uploadVerificationDocument(req, res) {
  if (!req.file) throw new ApiError(422, "A document file is required");
  // multer's fileFilter only saw the client-declared Content-Type header;
  // this checks the actual bytes now that the buffer exists (SA-04) — a file
  // relabeled with a spoofed "application/pdf" header is rejected here even
  // though it already passed the upload middleware.
  if (!isPdfBuffer(req.file.buffer)) {
    throw new ApiError(422, "That file doesn't look like a valid PDF — please upload an actual PDF document");
  }
  const { documentType } = req.validated.body;

  const profile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");
  if (profile.verificationStatus === "APPROVED") {
    throw new ApiError(409, "This account is already verified — no need to submit more documents");
  }
  if (isAwaitingReview(profile)) {
    throw new ApiError(409, "Your documents are already submitted and awaiting review");
  }

  // One document per type: re-uploading a type that's already on file (e.g. after
  // an admin requests a replacement) must overwrite it, not sit alongside it —
  // otherwise the stale copy keeps getting resubmitted unless manually deleted first.
  const existingDocument = await prisma.employerVerificationDocument.findFirst({
    where: { employerProfileId: profile.id, documentType },
  });

  const docPath = `employer-verification/${profile.id}/${crypto.randomUUID()}.pdf`;
  await uploadPrivateFile(docPath, req.file.buffer, req.file.mimetype);

  let document;
  if (existingDocument) {
    await removePrivateFile(existingDocument.filePath);
    document = await prisma.employerVerificationDocument.update({
      where: { id: existingDocument.id },
      data: { filePath: docPath, fileName: req.file.originalname, fileSize: req.file.size },
    });
  } else {
    document = await prisma.employerVerificationDocument.create({
      data: {
        employerProfileId: profile.id,
        documentType,
        filePath: docPath,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      },
    });
  }

  return sendSuccess(res, {
    statusCode: existingDocument ? 200 : 201,
    message: existingDocument ? "Document replaced" : "Document added",
    data: { id: document.id, documentType, fileName: document.fileName, fileSize: document.fileSize },
  });
}

export async function deleteVerificationDocument(req, res) {
  const { id } = req.validated.params;
  const profile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");
  if (isAwaitingReview(profile)) {
    throw new ApiError(409, "Your documents are already submitted and awaiting review");
  }

  const document = await prisma.employerVerificationDocument.findFirst({
    where: { id, employerProfileId: profile.id },
  });
  if (!document) throw new ApiError(404, "Document not found");

  await removePrivateFile(document.filePath);
  await prisma.employerVerificationDocument.delete({ where: { id } });
  return sendSuccess(res, { message: "Document removed" });
}

export async function submitVerification(req, res) {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: req.user.id },
    include: { _count: { select: { verificationDocuments: true } } },
  });
  if (!profile) throw new ApiError(404, "Employer profile not found");
  if (profile.verificationStatus === "APPROVED") {
    throw new ApiError(409, "This account is already verified");
  }
  if (isAwaitingReview(profile)) {
    throw new ApiError(409, "Your documents are already submitted and awaiting review");
  }
  if (profile._count.verificationDocuments === 0) {
    throw new ApiError(422, "Add at least one verification document before submitting");
  }

  const updated = await prisma.employerProfile.update({
    where: { userId: req.user.id },
    data: {
      verificationStatus: "PENDING",
      verificationNote: null,
      verificationSubmittedAt: new Date(),
      verifiedAt: null,
    },
  });

  await notifyAdmins({
    type: "NEW_VERIFICATION_REQUEST",
    title: "New company verification request",
    message: `${updated.companyName} submitted documents for verification review.`,
    link: "/admin/verifications",
  });

  return sendSuccess(res, {
    message: "Submitted for verification — our team will review it shortly",
    data: { verificationStatus: updated.verificationStatus },
  });
}

export async function submitEmployerSupportRequest(req, res) {
  const { category, subject, message } = req.validated.body;

  const profile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  await prisma.employerSupportRequest.create({
    data: { employerProfileId: profile.id, userId: req.user.id, category, subject, message },
  });

  const template = employerSupportRequestEmailTemplate({
    companyName: profile.companyName,
    contactName: req.user.name,
    contactEmail: req.user.email,
    category,
    subject,
    message,
  });
  // Emailing the admin is best-effort — the in-app notification below is the
  // reliable channel, so a Resend outage shouldn't fail the whole request.
  await sendEmail({ to: env.ADMIN_EMAIL, subject: template.subject, html: template.html }).catch((error) => {
    console.error("Failed to email admin about employer support request:", error.message);
  });

  await notifyAdmins({
    type: "EMPLOYER_SUPPORT_REQUEST",
    title: "New employer support request",
    message: `${profile.companyName} submitted a support request: ${subject}`,
    link: "/admin/employers",
  });

  return sendSuccess(res, { statusCode: 201, message: "Your support request has been sent to our team" });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getEmployerDashboard(req, res) {
  const userId = req.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalJobs, activeJobs, totalApplications, newApplications] =
    await prisma.$transaction([
      // revisesJobId: null — revision working copies aren't real listings.
      prisma.job.count({ where: { createdBy: userId, isDeleted: false, revisesJobId: null } }),
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
  await expireOverdueJobs();
  const userId = req.user.id;
  const { page, limit, search, status } = req.validated.query;

  const where = {
    createdBy: userId,
    isDeleted: false,
    // Revision working copies (drafts, pending-review edits, and rejected
    // edits) never appear as their own row here — only the Pending Jobs page
    // shows them. A rejected *new* submission (revisesJobId null) still
    // belongs here so the employer can see it, per the moderation workflow.
    revisesJobId: null,
    status: status ?? { notIn: PENDING_STATUSES },
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

// Jobs (new submissions) and revisions (edits to an already-live job) that
// are currently awaiting an admin decision, plus recently rejected revisions
// so the employer can see why an edit didn't go live. New-submission
// rejections are excluded here — those live on the main Jobs page instead.
export async function listEmployerPendingJobs(req, res) {
  const userId = req.user.id;
  const jobs = await prisma.job.findMany({
    where: {
      createdBy: userId,
      isDeleted: false,
      OR: [
        { status: { in: PENDING_STATUSES } },
        { status: "REJECTED", revisesJobId: { not: null } },
      ],
    },
    include: { revisesJob: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, { message: "Pending jobs retrieved", data: jobs });
}

export async function getEmployerJob(req, res) {
  const { id } = req.validated.params;
  const job = await prisma.job.findFirst({
    where: { id, createdBy: req.user.id, isDeleted: false },
    include: { revisesJob: { select: { id: true, title: true } } },
  });
  if (!job) throw new ApiError(404, "Job not found");
  return sendSuccess(res, { message: "Job retrieved", data: job });
}

// Starts (or resumes) an edit to a live job. The live job is never touched —
// a separate DRAFT row is created (or, if one is already in flight, reused)
// seeded from the live job's current content. The employer edits this
// working copy and submits it via updateEmployerJobStatus, which is the only
// way it can move to REVISION_PENDING_APPROVAL.
export async function createJobRevision(req, res) {
  const { id } = req.validated.params;
  const original = await prisma.job.findFirst({ where: { id, createdBy: req.user.id, isDeleted: false } });
  if (!original) throw new ApiError(404, "Job not found");
  if (original.status !== "ACTIVE") throw new ApiError(400, "Only a live job can be revised — edit it directly instead.");

  const existingRevision = await prisma.job.findFirst({
    where: { revisesJobId: id, isDeleted: false, status: { in: ["DRAFT", "REVISION_PENDING_APPROVAL"] } },
  });
  if (existingRevision) {
    return sendSuccess(res, { message: "Resuming the update already in progress for this job", data: existingRevision });
  }

  const revision = await prisma.job.create({
    data: { ...pickRevisableFields(original), createdBy: req.user.id, status: "DRAFT", revisesJobId: original.id },
  });
  return sendSuccess(res, { statusCode: 201, message: "Draft update created", data: revision });
}

export async function createEmployerJob(req, res) {
  const { status: _ignored, saveAsDraft, ...jobData } = req.validated.body;

  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
  if (!employerProfile) throw new ApiError(404, "Employer profile not found");
  if (employerProfile.isSuspended) throw new ApiError(403, "This account is suspended and cannot post jobs");

  const subscription = await getOrCreateSubscription(employerProfile.id);

  // The Free plan is capped at one job total — draft or live, verified or not —
  // not one free credit per month. Verification status still decides whether
  // that single job lands as ACTIVE or DRAFT below; it never raises the cap.
  if (subscription.planTier === "FREE") {
    const existingJobCount = await prisma.job.count({
      where: { createdBy: req.user.id, isDeleted: false, revisesJobId: null },
    });
    if (existingJobCount >= 1) {
      throw new ApiError(403, "The Free plan is limited to 1 job posting. Upgrade your plan to post more jobs.");
    }
  }

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

  const legitimacy = await checkJobLegitimacy(jobData, req.user.id);
  if (legitimacy.flagged) {
    const job = await prisma.job.create({
      data: { ...jobData, createdBy: req.user.id, status: "PENDING_REVIEW", flagReasons: legitimacy.reasons },
    });
    await notifyAdmins({
      type: "SUSPICIOUS_JOB_DETECTED",
      title: "Suspicious job detected",
      message: `"${job.title}" from ${employerProfile.companyName} was flagged for review: ${legitimacy.reasons.join(", ")}.`,
      link: "/admin/job-reviews",
    });
    return sendSuccess(res, {
      statusCode: 201,
      message: "Job submitted for admin review before it can go live",
      data: job,
    });
  }

  const creditSource = await consumeJobCredit(subscription, { userId: req.user.id, companyName: employerProfile.companyName });
  const listingDurationDays = jobData.listingDurationDays ?? 30;
  const expiresAt = new Date(Date.now() + listingDurationDays * 24 * 60 * 60 * 1000);

  const job = await prisma.job.create({
    data: { ...jobData, createdBy: req.user.id, status: "ACTIVE", creditSource, expiresAt },
  });
  await notify({
    userId: req.user.id,
    type: "JOB_PUBLISHED",
    title: "Job published",
    message: `"${job.title}" is now live and visible to candidates.`,
    link: "/employer/jobs",
  });
  return sendSuccess(res, { statusCode: 201, message: "Job published", data: job });
}

export async function updateEmployerJob(req, res) {
  const { id } = req.validated.params;
  const existing = await prisma.job.findFirst({
    where: { id, createdBy: req.user.id, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, "Job not found");
  if (PENDING_STATUSES.includes(existing.status)) throw new ApiError(409, PENDING_REVIEW_MESSAGE);
  // Live jobs are never edited in place — candidates are already seeing this
  // content, so a change has to go through the revision workflow (revise →
  // edit the DRAFT copy → submit for review) instead of silently mutating
  // what's currently public.
  if (existing.status === "ACTIVE") {
    throw new ApiError(409, "Live jobs can't be edited directly. Start an update from the Jobs page instead.");
  }

  const { status: _ignored, saveAsDraft: _ignoredDraft, ...jobData } = req.validated.body;
  const job = await prisma.job.update({ where: { id }, data: jobData });
  return sendSuccess(res, { message: "Job updated", data: job });
}

export async function updateEmployerJobStatus(req, res) {
  const { id } = req.validated.params;
  const { status: nextStatus } = req.validated.body;

  const job = await prisma.job.findFirst({ where: { id, createdBy: req.user.id, isDeleted: false } });
  if (!job) throw new ApiError(404, "Job not found");
  // A job already in the review queue can only leave PENDING_REVIEW through
  // approveJobReview/rejectJobReview — never through this generic endpoint,
  // regardless of the requested nextStatus (including re-requesting ACTIVE,
  // which would otherwise re-run the legitimacy check on possibly-edited
  // content and publish it for free without ever reaching an admin).
  if (PENDING_STATUSES.includes(job.status)) throw new ApiError(409, PENDING_REVIEW_MESSAGE);
  // A rejected job (new submission or revision) can't be silently
  // republished by the employer — that would defeat the point of having
  // rejected it. There's no resubmit flow yet, so this is a dead end short
  // of creating a fresh listing.
  if (job.status === "REJECTED" && nextStatus === "ACTIVE") {
    throw new ApiError(403, "Rejected jobs can't be republished directly. Create a new listing instead.");
  }

  // A DRAFT revision (revisesJobId set) has exactly one meaningful
  // transition: submitting it for admin review. It never auto-publishes —
  // no legitimacy check, no credit consumption — because approveJobReview is
  // the only thing allowed to merge it into the live job.
  if (job.revisesJobId) {
    if (nextStatus !== "REVISION_PENDING_APPROVAL") {
      throw new ApiError(400, "This update can only be submitted for review.");
    }
    const updated = await prisma.job.update({ where: { id }, data: { status: "REVISION_PENDING_APPROVAL" } });
    await notifyAdmins({
      type: "JOB_REVISION_SUBMITTED",
      title: "Job update submitted for review",
      message: `An update to "${job.title}" was submitted for review.`,
      link: "/admin/job-reviews",
    });
    return sendSuccess(res, { message: "Update submitted for admin review", data: updated });
  }

  // Publishing (moving into ACTIVE from a non-active state) is gated by
  // verification + job credits, same as creating a brand-new job.
  if (nextStatus === "ACTIVE" && job.status !== "ACTIVE") {
    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: req.user.id } });
    if (!employerProfile) throw new ApiError(404, "Employer profile not found");
    if (employerProfile.isSuspended) throw new ApiError(403, "This account is suspended and cannot publish jobs");
    if (employerProfile.verificationStatus !== "APPROVED") {
      await notify({
        userId: req.user.id,
        type: "PUBLISHING_BLOCKED",
        title: "Publishing blocked",
        message: `"${job.title}" can't go live until your company verification is approved.`,
        link: "/employer/verification",
      });
      throw new ApiError(403, "Publishing is locked until company verification is approved");
    }

    const legitimacy = await checkJobLegitimacy(job, req.user.id);
    if (legitimacy.flagged) {
      await prisma.job.update({
        where: { id },
        data: { status: "PENDING_REVIEW", flagReasons: legitimacy.reasons },
      });
      await notifyAdmins({
        type: "SUSPICIOUS_JOB_DETECTED",
        title: "Suspicious job detected",
        message: `"${job.title}" from ${employerProfile.companyName} was flagged for review: ${legitimacy.reasons.join(", ")}.`,
        link: "/admin/job-reviews",
      });
      return sendSuccess(res, { message: "Job submitted for admin review before it can go live" });
    }

    const subscription = await getOrCreateSubscription(employerProfile.id);
    const creditSource = await consumeJobCredit(subscription, { userId: req.user.id, companyName: employerProfile.companyName });
    const expiresAt = new Date(Date.now() + job.listingDurationDays * 24 * 60 * 60 * 1000);

    await prisma.job.update({
      where: { id },
      data: { status: "ACTIVE", creditSource, expiresAt },
    });
    await notify({
      userId: req.user.id,
      type: "JOB_PUBLISHED",
      title: "Job published",
      message: `"${job.title}" is now live and visible to candidates.`,
      link: "/employer/jobs",
    });
    return sendSuccess(res, { message: "Job published" });
  }

  await prisma.job.update({ where: { id }, data: { status: nextStatus } });
  if (job.status === "ACTIVE" && nextStatus !== "ACTIVE") {
    await notifyJobClosedForCandidates(job);
    await notifyAdmins({
      type: "JOB_MANUALLY_CLOSED",
      title: "Job manually closed",
      message: `"${job.title}" was manually closed by its employer.`,
      link: "/admin/jobs",
    });
  }
  return sendSuccess(res, { message: "Job status updated" });
}

export async function deleteEmployerJob(req, res) {
  const { id } = req.validated.params;
  const existing = await prisma.job.findFirst({ where: { id, createdBy: req.user.id, isDeleted: false } });
  if (!existing) throw new ApiError(404, "Job not found");
  if (PENDING_STATUSES.includes(existing.status)) throw new ApiError(409, PENDING_REVIEW_MESSAGE);

  await prisma.job.update({ where: { id }, data: { isDeleted: true, status: "INACTIVE" } });
  if (existing.status === "ACTIVE") await notifyJobClosedForCandidates(existing);
  return sendSuccess(res, { message: "Job deleted" });
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function listAllApplications(req, res) {
  const userId = req.user.id;
  const { page, limit, search, status, jobId } = req.validated.query;

  const where = {
    job: { createdBy: userId },
    ...(jobId ? { jobId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { job: { title: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [applications, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      include: { user: { include: { profile: true }, omit: { passwordHash: true } }, job: { select: { id: true, title: true } } },
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
      include: { user: { include: { profile: true }, omit: { passwordHash: true } } },
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
    include: {
      user: {
        include: {
          profile: {
            include: { employmentEntries: true, educationEntries: true, certifications: true },
          },
        },
        omit: { passwordHash: true },
      },
      job: true,
    },
  });
  if (!application) throw new ApiError(404, "Application not found");

  let resumeUrl = null;
  if (application.user.profile?.resumePath) {
    resumeUrl = await createSignedDownloadUrl(application.user.profile.resumePath);

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (employerProfile) {
      await prisma.resumeUnlockEvent.upsert({
        where: { employerProfileId_applicationId: { employerProfileId: employerProfile.id, applicationId: id } },
        create: { employerProfileId: employerProfile.id, applicationId: id },
        update: {},
      });
    }
  }

  return sendSuccess(res, { message: "Application retrieved", data: { ...application, resumeUrl } });
}
