import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export async function notify({ userId, type, title, message, link = null }) {
  return prisma.notification.create({ data: { userId, type, title, message, link } });
}

export async function notifyUsers(userIds, { type, title, message, link = null }) {
  const uniqueIds = [...new Set(userIds)];
  if (!uniqueIds.length) return;
  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({ userId, type, title, message, link })),
  });
}

export async function notifyAdmins({ type, title, message, link = null }) {
  const admins = await prisma.user.findMany({ where: { role: Role.ADMIN }, select: { id: true } });
  await notifyUsers(admins.map((a) => a.id), { type, title, message, link });
}

// Notifies every candidate who applied to or saved a job that it has closed
// (deactivated, expired, or removed). Reused by every place a job transitions
// away from ACTIVE — admin close, employer close, soft delete, and expiry sweep.
export async function notifyJobClosedForCandidates(job) {
  const [applicants, savers] = await Promise.all([
    prisma.application.findMany({ where: { jobId: job.id }, select: { userId: true } }),
    prisma.savedJob.findMany({ where: { jobId: job.id }, select: { userId: true } }),
  ]);

  await notifyUsers(applicants.map((a) => a.userId), {
    type: "APPLIED_JOB_CLOSED",
    title: "A job you applied to has closed",
    message: `"${job.title}" at ${job.companyName} is no longer accepting applications.`,
    link: "/dashboard/applications",
  });

  await notifyUsers(savers.map((s) => s.userId), {
    type: "SAVED_JOB_CLOSED",
    title: "A saved job is no longer available",
    message: `"${job.title}" at ${job.companyName} has closed.`,
    link: "/dashboard/saved-jobs",
  });
}
