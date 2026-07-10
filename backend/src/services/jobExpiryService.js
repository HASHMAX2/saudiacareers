import { prisma } from "../config/prisma.js";
import { notify, notifyJobClosedForCandidates } from "./notificationService.js";

// Lazily sweeps ACTIVE jobs whose expiresAt has passed. Mirrors the existing
// "check on read" pattern used for the monthly free-job reset and the
// scheduled-cancellation downgrade — there's no cron/queue in this app.
export async function expireOverdueJobs() {
  const now = new Date();
  const overdue = await prisma.job.findMany({
    where: { status: "ACTIVE", isDeleted: false, expiresAt: { lt: now } },
    select: { id: true, title: true, companyName: true, createdBy: true },
  });
  if (!overdue.length) return;

  await prisma.job.updateMany({
    where: { id: { in: overdue.map((j) => j.id) } },
    data: { status: "EXPIRED" },
  });

  for (const job of overdue) {
    await notify({
      userId: job.createdBy,
      type: "JOB_EXPIRED",
      title: "Job listing expired",
      message: `Your job "${job.title}" has expired and is no longer visible to candidates.`,
      link: "/employer/jobs",
    });
    await notifyJobClosedForCandidates(job);
  }
}
