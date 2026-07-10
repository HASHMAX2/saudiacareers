import { prisma } from "../config/prisma.js";
import { PRICE_PER_CREDIT_SAR } from "../config/plans.js";
import { getOrCreateSubscription } from "../services/employerBillingService.js";
import { createSignedViewUrl } from "../services/storageService.js";
import { notify, notifyAdmins } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// ── Verification review ──────────────────────────────────────────────────────

const VERIFICATION_SLA_HOURS = 24;

function domainOf(value) {
  if (!value) return null;
  const emailMatch = value.match(/@([^@\s]+)$/);
  if (emailMatch) return emailMatch[1].toLowerCase();
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function computeSlaStatus(profile) {
  const submittedAt = profile.verificationSubmittedAt ?? profile.createdAt;
  const deadline = new Date(submittedAt.getTime() + VERIFICATION_SLA_HOURS * 60 * 60 * 1000);
  const msRemaining = deadline.getTime() - Date.now();
  const hoursRemaining = Math.abs(msRemaining) / (60 * 60 * 1000);
  return {
    submittedAt,
    deadline,
    breached: msRemaining < 0,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
  };
}

function computeSignals(profile) {
  const emailDomain = domainOf(profile.user?.email);
  const websiteDomain = domainOf(profile.website);
  return {
    emailDomainMatches: Boolean(emailDomain && websiteDomain && emailDomain === websiteDomain),
    hasWebsite: Boolean(profile.website),
    hasLinkedIn: Boolean(profile.linkedinUrl),
    hasDocument: profile.verificationDocuments?.length > 0,
  };
}

async function withDocuments(profile) {
  const documents = await Promise.all(
    (profile.verificationDocuments ?? []).map(async (doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      viewUrl: await createSignedViewUrl(doc.filePath),
    })),
  );
  return { ...profile, verificationDocuments: undefined, documents };
}

export async function listPendingVerifications(req, res) {
  const { page, limit } = req.validated.query;
  const where = { verificationStatus: "PENDING" };

  const [profiles, total] = await prisma.$transaction([
    prisma.employerProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { verificationSubmittedAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employerProfile.count({ where }),
  ]);

  const enriched = await Promise.all(
    profiles.map(async (p) => ({
      ...(await withDocuments(p)),
      sla: computeSlaStatus(p),
      signals: computeSignals(p),
    })),
  );

  return sendSuccess(res, {
    message: "Pending verifications retrieved",
    data: { profiles: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function getVerificationDetail(req, res) {
  const { id } = req.validated.params;
  const profile = await prisma.employerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, mobile: true } },
      verificationDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const firstJob = await prisma.job.findFirst({
    where: { createdBy: profile.userId, isDeleted: false },
    orderBy: { createdAt: "asc" },
  });

  return sendSuccess(res, {
    message: "Employer verification detail retrieved",
    data: {
      ...(await withDocuments(profile)),
      sla: computeSlaStatus(profile),
      signals: computeSignals(profile),
      firstJob,
    },
  });
}

export async function approveVerification(req, res) {
  const { id } = req.validated.params;
  const profile = await prisma.employerProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const updated = await prisma.employerProfile.update({
    where: { id },
    data: {
      verificationStatus: "APPROVED",
      verifiedAt: new Date(),
      verificationNote: req.validated.body.note || null,
    },
  });
  await notify({
    userId: updated.userId,
    type: "COMPANY_APPROVED",
    title: "Company approved",
    message: "Your company has been verified — you can now publish jobs.",
    link: "/employer/dashboard",
  });
  return sendSuccess(res, { message: "Employer verified", data: updated });
}

export async function rejectVerification(req, res) {
  const { id } = req.validated.params;
  const profile = await prisma.employerProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const updated = await prisma.employerProfile.update({
    where: { id },
    data: {
      verificationStatus: "REJECTED",
      verifiedAt: null,
      verificationNote: req.validated.body.note,
    },
  });
  await notify({
    userId: updated.userId,
    type: "COMPANY_REJECTED",
    title: "Company rejected",
    message: `Your company verification was rejected: ${req.validated.body.note}`,
    link: "/employer/verification",
  });
  return sendSuccess(res, { message: "Verification rejected", data: updated });
}

export async function requestMoreInfo(req, res) {
  const { id } = req.validated.params;
  const profile = await prisma.employerProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const updated = await prisma.employerProfile.update({
    where: { id },
    data: {
      verificationStatus: "PENDING",
      verificationNote: req.validated.body.note,
    },
  });
  return sendSuccess(res, { message: "Requested more information from the employer", data: updated });
}

// ── Billing overview ──────────────────────────────────────────────────────────

export async function listBillingOverview(req, res) {
  const { page, limit, search } = req.validated.query;
  const where = search
    ? { companyName: { contains: search, mode: "insensitive" } }
    : {};

  const [profiles, total] = await prisma.$transaction([
    prisma.employerProfile.findMany({
      where,
      include: { subscription: true },
      orderBy: { companyName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employerProfile.count({ where }),
  ]);

  const overview = profiles.map((p) => {
    const status = p.verificationStatus !== "APPROVED"
      ? "PENDING_APPROVAL"
      : p.subscription?.cancelAtPeriodEnd
        ? "CANCELLING"
        : "ACTIVE";
    return {
      id: p.id,
      companyName: p.companyName,
      planTier: p.subscription?.planTier ?? "FREE",
      status,
      paidCreditsRemaining: p.subscription?.paidCreditsRemaining ?? 0,
      renewsAt: p.subscription?.renewsAt ?? null,
    };
  });

  return sendSuccess(res, {
    message: "Billing overview retrieved",
    data: { employers: overview, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export async function listInvoicesAdmin(req, res) {
  const { page, limit, status } = req.validated.query;
  const where = status ? { status } : {};

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      include: { employerProfile: { select: { companyName: true } } },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return sendSuccess(res, {
    message: "Invoices retrieved",
    data: { invoices, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function markInvoicePaid(req, res) {
  const { id } = req.validated.params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status !== "PENDING") throw new ApiError(400, "Only pending invoices can be marked paid");

  const employerProfile = await prisma.employerProfile.findUnique({ where: { id: invoice.employerProfileId } });
  const subscription = await getOrCreateSubscription(invoice.employerProfileId);
  const now = new Date();

  if (invoice.type === "SUBSCRIPTION") {
    const plan = await prisma.plan.findFirst({ where: { priceSar: invoice.amountSar } });
    if (!plan) throw new ApiError(400, "Could not match invoice amount to a known plan");
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { planTier: plan.tier, renewsAt, cancelAtPeriodEnd: false },
    });
    await notify({
      userId: employerProfile.userId,
      type: "SUBSCRIPTION_ACTIVATED",
      title: "Subscription activated",
      message: `Your ${plan.name} plan is now active.`,
      link: "/employer/billing",
    });
  } else if (invoice.type === "CREDIT_PACK") {
    const credits = Math.round(invoice.amountSar / PRICE_PER_CREDIT_SAR);
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { paidCreditsRemaining: { increment: credits } },
    });
  } else {
    throw new ApiError(400, "Refund invoices cannot be marked paid — use mark-refunded instead");
  }

  const updated = await prisma.invoice.update({ where: { id }, data: { status: "PAID", paidAt: now } });
  await notify({
    userId: employerProfile.userId,
    type: "PAYMENT_SUCCESSFUL",
    title: "Payment successful",
    message: `Payment of ${invoice.amountSar} SAR for invoice #${invoice.id} was confirmed.`,
    link: "/employer/billing",
  });
  return sendSuccess(res, { message: "Invoice marked paid", data: updated });
}

export async function markInvoiceFailed(req, res) {
  const { id } = req.validated.params;
  const { reason } = req.validated.body;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status !== "PENDING") throw new ApiError(400, "Only pending invoices can be marked failed");

  const employerProfile = await prisma.employerProfile.findUnique({ where: { id: invoice.employerProfileId } });
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "FAILED", note: `Payment failed: ${reason}` },
  });

  await notify({
    userId: employerProfile.userId,
    type: "PAYMENT_FAILED",
    title: "Payment failed",
    message: `Your payment of ${invoice.amountSar} SAR for invoice #${invoice.id} could not be confirmed: ${reason}`,
    link: "/employer/billing",
  });
  await notifyAdmins({
    type: "PAYMENT_FAILED_FOR_COMPANY",
    title: "Payment failed for company",
    message: `${employerProfile.companyName}'s payment for invoice #${invoice.id} failed: ${reason}`,
    link: "/admin/invoices",
  });

  return sendSuccess(res, { message: "Invoice marked failed", data: updated });
}

export async function markInvoiceRefunded(req, res) {
  const { id } = req.validated.params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.type !== "REFUND" || invoice.status !== "REFUND_REQUESTED") {
    throw new ApiError(400, "Only requested refunds can be marked refunded");
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "REFUNDED", paidAt: new Date() },
  });
  return sendSuccess(res, { message: "Refund marked complete", data: updated });
}

export async function rejectInvoiceRefund(req, res) {
  const { id } = req.validated.params;
  const { reason } = req.validated.body;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.type !== "REFUND" || invoice.status !== "REFUND_REQUESTED") {
    throw new ApiError(400, "Only requested refunds can be rejected");
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "PAID", note: `Refund rejected: ${reason}` },
  });
  return sendSuccess(res, { message: "Refund request rejected", data: updated });
}
