import { prisma } from "../config/prisma.js";
import { createSignedDownloadUrl } from "../services/storageService.js";
import * as dodoService from "../services/dodoService.js";
import { notify } from "../services/notificationService.js";
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
      // Forced download, not inline view (SA-04) — an admin reviewing an
      // unverified employer's document shouldn't have it rendered inline by
      // the browser on a self-registered, unvetted upload.
      viewUrl: await createSignedDownloadUrl(doc.filePath),
    })),
  );
  return { ...profile, verificationDocuments: undefined, documents };
}

export async function listPendingVerifications(req, res) {
  const { page, limit } = req.validated.query;
  // verificationStatus defaults to PENDING the moment an employer registers,
  // before they've submitted anything — only verificationSubmittedAt marks an
  // actual review request. Without this check every not-yet-onboarded
  // employer would clutter the approval queue.
  const where = { verificationStatus: "PENDING", verificationSubmittedAt: { not: null } };

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
  const { note } = req.validated.body;
  const profile = await prisma.employerProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, "Employer profile not found");

  const updated = await prisma.employerProfile.update({
    where: { id },
    data: {
      verificationStatus: "PENDING",
      verificationNote: note,
      // Clearing this un-locks the employer's document form (it's only locked
      // while PENDING *and* submitted) — otherwise they'd see the note asking
      // them to fix something but have no way to actually add/remove documents.
      verificationSubmittedAt: null,
    },
  });
  // The message body is the admin's note verbatim — no prefix/wrapping — since
  // it's the employer-facing explanation of what's missing or needs fixing.
  await notify({
    userId: updated.userId,
    type: "VERIFICATION_INFO_REQUESTED",
    title: "More information requested",
    message: note,
    link: "/employer/verification",
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

// Payment confirmation is no longer a human clicking "mark paid" — the Dodo
// webhook handler (dodoWebhookController.js) is the sole source of truth for
// invoice/subscription state now that a real gateway is wired in.

export async function approveRefund(req, res) {
  const { id } = req.validated.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { refundsInvoice: true, employerProfile: true },
  });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.type !== "REFUND" || invoice.status !== "REFUND_REQUESTED") {
    throw new ApiError(400, "Only requested refunds can be approved");
  }
  if (!invoice.refundsInvoice?.gatewayRef) {
    throw new ApiError(409, "No gateway payment reference found for the original invoice — cannot issue a refund");
  }

  // Guard against approving two separate refund-request rows that both point
  // at the same original invoice (e.g. an employer submitted duplicate
  // requests before this was blocked at request time) — never issue a second
  // gateway refund against a payment already refunded.
  const alreadyRefunded = await prisma.invoice.findFirst({
    where: { refundsInvoiceId: invoice.refundsInvoiceId, status: "REFUNDED", id: { not: invoice.id } },
  });
  if (alreadyRefunded) {
    throw new ApiError(409, "This original invoice has already been refunded via a different request");
  }

  await dodoService.createRefund({
    paymentGatewayRef: invoice.refundsInvoice.gatewayRef,
    reason: invoice.note,
    metadata: { employerProfileId: String(invoice.employerProfileId), invoiceId: String(invoice.id) },
  });

  await notify({
    userId: invoice.employerProfile.userId,
    type: "REFUND_APPROVED",
    title: "Refund approved",
    message: `Your refund for invoice #${invoice.refundsInvoiceId} has been submitted and will be confirmed shortly.`,
    link: "/employer/billing",
  });

  return sendSuccess(res, {
    message: "Refund submitted to the payment gateway — it will be confirmed shortly",
    data: invoice,
  });
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
