import { prisma } from "../config/prisma.js";
import { PLAN_LIST, PRICE_PER_CREDIT_SAR } from "../config/plans.js";
import { getOrCreateSubscription } from "../services/employerBillingService.js";
import { createSignedViewUrl } from "../services/storageService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// ── Verification review ──────────────────────────────────────────────────────

export async function listPendingVerifications(req, res) {
  const { page, limit } = req.validated.query;
  const where = { verificationStatus: "PENDING", verificationDocPath: { not: null } };

  const [profiles, total] = await prisma.$transaction([
    prisma.employerProfile.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employerProfile.count({ where }),
  ]);

  const withUrls = await Promise.all(
    profiles.map(async (p) => ({
      ...p,
      documentUrl: p.verificationDocPath ? await createSignedViewUrl(p.verificationDocPath) : null,
    })),
  );

  return sendSuccess(res, {
    message: "Pending verifications retrieved",
    data: { profiles: withUrls, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
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
  return sendSuccess(res, { message: "Verification rejected", data: updated });
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

  const subscription = await getOrCreateSubscription(invoice.employerProfileId);
  const now = new Date();

  if (invoice.type === "SUBSCRIPTION") {
    const plan = PLAN_LIST.find((p) => p.priceSar === invoice.amountSar);
    if (!plan) throw new ApiError(400, "Could not match invoice amount to a known plan");
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { planTier: plan.tier, renewsAt, cancelAtPeriodEnd: false },
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
  return sendSuccess(res, { message: "Invoice marked paid", data: updated });
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
