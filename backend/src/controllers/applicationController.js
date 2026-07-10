import { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { sendEmail } from "../services/emailService.js";
import { applicationEmailTemplate } from "../services/emailTemplates/application.js";
import { downloadPrivateFile } from "../services/storageService.js";
import { notify, notifyAdmins } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const HIGH_APPLICATION_MILESTONES = new Set([10, 25, 50, 100, 250, 500]);

async function deliverApplication(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      user: { include: { profile: true } },
    },
  });
  try {
    const resume = await downloadPrivateFile(application.user.profile.resumePath);
    const template = applicationEmailTemplate({
      job: application.job,
      candidate: application.user,
      profile: application.user.profile,
    });
    const hrEmail = process.env.TEST_HR_EMAIL ?? application.job.hrEmail;
    await sendEmail({
      to: hrEmail,
      ...template,
      attachments: [
        {
          filename: application.user.profile.resumeFilename,
          content: resume,
        },
      ],
    });
    await prisma.application.update({
      where: { id: applicationId },
      data: { hrEmailStatus: "SENT", hrEmailSentAt: new Date(), hrEmailError: null },
    });
  } catch (error) {
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        hrEmailStatus: "FAILED",
        hrEmailError: String(error.message).slice(0, 500),
      },
    });
  }
}

export async function apply(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { profile: true },
  });
  const job = await prisma.job.findFirst({
    where: {
      id: req.validated.body.jobId,
      status: JobStatus.ACTIVE,
      isDeleted: false,
    },
  });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    throw new ApiError(409, "This job is closed");
  }
  if (!user.profile?.designation || !user.profile.experience || !user.profile.skills) {
    throw new ApiError(422, "Complete designation, experience, and skills before applying");
  }
  if (!user.profile.resumePath) {
    throw new ApiError(422, "Upload a resume before applying");
  }

  let application;
  try {
    application = await prisma.application.create({
      data: { userId: user.id, jobId: job.id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "You have already applied for this job");
    }
    throw error;
  }
  setImmediate(() => deliverApplication(application.id));

  await notify({
    userId: user.id,
    type: "APPLICATION_SUBMITTED",
    title: "Application submitted",
    message: `Your application for "${job.title}" at ${job.companyName} was submitted.`,
    link: "/dashboard/applications",
  });
  await notify({
    userId: job.createdBy,
    type: "NEW_APPLICATION_RECEIVED",
    title: "New application received",
    message: `${user.name} applied for "${job.title}".`,
    link: "/employer/applicants",
  });

  const applicationCount = await prisma.application.count({ where: { jobId: job.id } });
  if (HIGH_APPLICATION_MILESTONES.has(applicationCount)) {
    await notifyAdmins({
      type: "HIGH_APPLICATION_VOLUME",
      title: "High number of applications on a job",
      message: `"${job.title}" at ${job.companyName} has reached ${applicationCount} applications.`,
      link: "/admin/applications",
    });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: "Application submitted",
    data: application,
  });
}

export async function mine(req, res) {
  const applications = await prisma.application.findMany({
    where: { userId: req.user.id },
    orderBy: { appliedAt: "desc" },
    include: {
      job: {
        select: { id: true, title: true, companyName: true, location: true },
      },
    },
  });
  return sendSuccess(res, {
    message: "Applications retrieved",
    data: applications,
  });
}

export async function mineIds(req, res) {
  const applications = await prisma.application.findMany({
    where: { userId: req.user.id },
    select: { jobId: true },
  });
  return sendSuccess(res, {
    message: "Applied job IDs retrieved",
    data: applications.map((a) => a.jobId),
  });
}

