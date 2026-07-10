import { prisma } from "../config/prisma.js";
import { notify, notifyAdmins } from "./notificationService.js";
import { ApiError } from "../utils/ApiError.js";

export async function getOrCreateSubscription(employerProfileId) {
  const existing = await prisma.employerSubscription.findUnique({ where: { employerProfileId } });
  if (!existing) return prisma.employerSubscription.create({ data: { employerProfileId } });

  // Lazily apply the scheduled cancellation once the paid period has actually
  // ended — mirrors the same "check on read" pattern used for the monthly
  // free-job reset, since there's no real payment gateway/cron to drive this.
  if (existing.cancelAtPeriodEnd && existing.renewsAt && existing.renewsAt < new Date()) {
    const downgraded = await prisma.employerSubscription.update({
      where: { id: existing.id },
      data: { planTier: "FREE", cancelAtPeriodEnd: false, renewsAt: null },
    });
    const profile = await prisma.employerProfile.findUnique({
      where: { id: employerProfileId },
      select: { userId: true },
    });
    if (profile) {
      await notify({
        userId: profile.userId,
        type: "SUBSCRIPTION_ENDED",
        title: "Subscription ended",
        message: "Your paid plan has ended and your account is now on the Free Plan.",
        link: "/employer/billing",
      });
    }
    return downgraded;
  }

  return existing;
}

function isSameCalendarMonth(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

// Consumes one job-posting credit (free-monthly first, then paid), updating the
// subscription in place. Throws ApiError(402) if nothing is available.
// Returns the creditSource string to stamp onto the job.
// `actor` ({ userId, companyName }) is used to fire the related notifications.
export async function consumeJobCredit(subscription, actor) {
  const now = new Date();
  const freeJobAvailable = !subscription.freeJobUsedAt || !isSameCalendarMonth(subscription.freeJobUsedAt, now);

  if (freeJobAvailable) {
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { freeJobUsedAt: now },
    });
    if (actor?.userId) {
      await notify({
        userId: actor.userId,
        type: "FREE_JOB_LIMIT_USED",
        title: "Free job limit used",
        message: "You've used your free job posting for this month. Additional postings will use paid credits.",
        link: "/employer/billing",
      });
      await notifyAdmins({
        type: "EMPLOYER_FREE_JOB_LIMIT",
        title: "Employer hit free job limit",
        message: `${actor.companyName ?? "An employer"} has used their free monthly job post.`,
        link: "/admin/billing",
      });
    }
    return "FREE";
  }

  if (subscription.paidCreditsRemaining > 0) {
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { paidCreditsRemaining: { decrement: 1 } },
    });
    return "PAID";
  }

  if (actor?.userId) {
    await notify({
      userId: actor.userId,
      type: "PUBLISHING_BLOCKED",
      title: "Publishing blocked",
      message: "No job credits remaining — purchase more credits or upgrade your plan to publish this job.",
      link: "/employer/billing",
    });
  }
  throw new ApiError(402, "No job credits remaining — purchase more credits or upgrade your plan");
}
