import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export async function getOrCreateSubscription(employerProfileId) {
  const existing = await prisma.employerSubscription.findUnique({ where: { employerProfileId } });
  if (existing) return existing;
  return prisma.employerSubscription.create({ data: { employerProfileId } });
}

function isSameCalendarMonth(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

// Consumes one job-posting credit (free-monthly first, then paid), updating the
// subscription in place. Throws ApiError(402) if nothing is available.
// Returns the creditSource string to stamp onto the job.
export async function consumeJobCredit(subscription) {
  const now = new Date();
  const freeJobAvailable = !subscription.freeJobUsedAt || !isSameCalendarMonth(subscription.freeJobUsedAt, now);

  if (freeJobAvailable) {
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { freeJobUsedAt: now },
    });
    return "FREE";
  }

  if (subscription.paidCreditsRemaining > 0) {
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { paidCreditsRemaining: { decrement: 1 } },
    });
    return "PAID";
  }

  throw new ApiError(402, "No job credits remaining — purchase more credits or upgrade your plan");
}
