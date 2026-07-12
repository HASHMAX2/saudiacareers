import { ZipArchive } from "archiver";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { CREDIT_PACK_DODO_PRODUCT_ID, PRICE_PER_CREDIT_SAR } from "../config/plans.js";
import { getOrCreateSubscription } from "../services/employerBillingService.js";
import * as dodoService from "../services/dodoService.js";
import { notify, notifyAdmins } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const INVOICE_TYPE_LABELS = { SUBSCRIPTION: "Plan subscription", CREDIT_PACK: "Job credit pack", REFUND: "Refund" };

async function requireEmployerProfile(userId) {
  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
  if (!employerProfile) throw new ApiError(404, "Employer profile not found");
  return employerProfile;
}

function buildInvoicePdfDoc(invoice, employerProfile) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.fontSize(20).fillColor("#F44336").text("SaudiaCareers");
  doc.fontSize(10).fillColor("#666666").text("Billing invoice");
  doc.moveDown(1.5);

  doc.fontSize(16).fillColor("#111111").text(`Invoice #${invoice.id}`);
  doc.moveDown(0.75);

  doc.fontSize(11).fillColor("#333333");
  doc.text(`Billed to: ${employerProfile.companyName}`);
  doc.text(`Type: ${INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}`);
  if (invoice.note) doc.text(`Details: ${invoice.note}`);
  doc.text(`Date issued: ${invoice.issuedAt.toDateString()}`);
  if (invoice.paidAt) doc.text(`Date paid: ${invoice.paidAt.toDateString()}`);
  doc.text(`Status: ${invoice.status}`);

  doc.moveDown(1.5);
  doc.fontSize(18).fillColor("#111111").text(`Amount: ${invoice.amountSar} SAR`, { align: "right" });

  return doc;
}

function resolveContactEmail(employerProfile, req) {
  return employerProfile.billingEmail || req.user.email;
}

function currentPeriodOf(subscription) {
  return subscription.currentPeriodStart ?? subscription.createdAt;
}

// If the Dodo call after creating a PENDING invoice throws (gateway not
// configured, network error, etc.), the invoice must not be left behind as an
// orphaned record with no checkout ever attached to it.
async function withInvoiceCleanup(invoiceId, action) {
  try {
    return await action();
  } catch (error) {
    await prisma.invoice.delete({ where: { id: invoiceId } }).catch(() => {});
    throw error;
  }
}

export async function getBillingSummary(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);
  const [plans, paymentMethod, pendingInvoice] = await Promise.all([
    prisma.plan.findMany({ orderBy: { priceSar: "asc" } }),
    prisma.employerPaymentMethod.findUnique({ where: { employerProfileId: employerProfile.id } }),
    prisma.invoice.findFirst({
      where: { employerProfileId: employerProfile.id, status: "PENDING" },
      orderBy: { issuedAt: "desc" },
    }),
  ]);
  const currentPlan = plans.find((p) => p.tier === subscription.planTier) ?? null;

  const periodStart = currentPeriodOf(subscription);
  const periodEnd = subscription.renewsAt;
  const now = new Date();
  const cycleElapsedPct =
    periodStart && periodEnd && periodEnd > periodStart
      ? Math.min(100, Math.max(0, Math.round(((now - periodStart) / (periodEnd - periodStart)) * 100)))
      : null;
  const sinceDate = periodStart ?? new Date(0);

  const [jobsPostedThisCycle, activeJobListings, applicationsThisCycle, resumeUnlocksThisCycle, storageAgg] =
    await Promise.all([
      prisma.job.count({ where: { createdBy: req.user.id, isDeleted: false, createdAt: { gte: sinceDate } } }),
      prisma.job.count({ where: { createdBy: req.user.id, isDeleted: false, status: "ACTIVE" } }),
      prisma.application.count({ where: { job: { createdBy: req.user.id }, appliedAt: { gte: sinceDate } } }),
      prisma.resumeUnlockEvent.count({
        where: { employerProfileId: employerProfile.id, createdAt: { gte: sinceDate } },
      }),
      prisma.employerVerificationDocument.aggregate({
        where: { employerProfileId: employerProfile.id },
        _sum: { fileSize: true },
      }),
    ]);

  return sendSuccess(res, {
    message: "Billing summary retrieved",
    data: {
      subscription,
      plans,
      currentPlan,
      paymentMethod,
      pendingInvoice,
      pricePerCreditSar: PRICE_PER_CREDIT_SAR,
      dodoConfigured: dodoService.isDodoConfigured(),
      upcomingCharge: currentPlan
        ? { baseSar: currentPlan.priceSar, taxSar: 0, discountSar: 0, totalSar: currentPlan.priceSar }
        : null,
      usage: {
        periodStart,
        periodEnd,
        cycleElapsedPct,
        jobsPostedThisCycle,
        activeJobListings,
        applicationsThisCycle,
        resumeUnlocksThisCycle,
        storageUsedBytes: storageAgg._sum.fileSize ?? 0,
      },
    },
  });
}

export async function listInvoices(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { page, limit } = req.validated.query;

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where: { employerProfileId: employerProfile.id },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: { employerProfileId: employerProfile.id } }),
  ]);

  return sendSuccess(res, {
    message: "Invoices retrieved",
    data: { invoices, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function listTransactions(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { page, limit } = req.validated.query;

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { employerProfileId: employerProfile.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { employerProfileId: employerProfile.id } }),
  ]);

  return sendSuccess(res, {
    message: "Transactions retrieved",
    data: { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
}

export async function downloadInvoicePdf(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { id } = req.validated.params;
  const invoice = await prisma.invoice.findFirst({ where: { id, employerProfileId: employerProfile.id } });
  if (!invoice) throw new ApiError(404, "Invoice not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.id}.pdf"`);

  const doc = buildInvoicePdfDoc(invoice, employerProfile);
  doc.pipe(res);
  doc.end();
}

export async function downloadAllInvoicesZip(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const invoices = await prisma.invoice.findMany({
    where: { employerProfileId: employerProfile.id },
    orderBy: { issuedAt: "desc" },
  });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="invoices-${employerProfile.id}.zip"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.pipe(res);
  for (const invoice of invoices) {
    const doc = buildInvoicePdfDoc(invoice, employerProfile);
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    await new Promise((resolve) => {
      doc.on("end", resolve);
      doc.end();
    });
    archive.append(Buffer.concat(chunks), { name: `invoice-${invoice.id}.pdf` });
  }
  await archive.finalize();
}

export async function purchaseCredits(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { credits } = req.validated.body;
  if (!CREDIT_PACK_DODO_PRODUCT_ID) {
    throw new ApiError(503, "Credit purchases aren't configured yet — contact support");
  }

  const invoice = await prisma.invoice.create({
    data: {
      employerProfileId: employerProfile.id,
      type: "CREDIT_PACK",
      amountSar: credits * PRICE_PER_CREDIT_SAR,
      status: "PENDING",
      note: `${credits} job credit${credits === 1 ? "" : "s"}`,
    },
  });

  const session = await withInvoiceCleanup(invoice.id, () =>
    dodoService.createCreditPackCheckout({
      employerProfile,
      contactEmail: resolveContactEmail(employerProfile, req),
      creditProductId: CREDIT_PACK_DODO_PRODUCT_ID,
      quantity: credits,
      metadata: {
        employerProfileId: String(employerProfile.id),
        invoiceId: String(invoice.id),
        kind: "CREDIT_PACK",
        credits: String(credits),
      },
    }),
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: "Checkout created for your credit purchase",
    data: { invoice, checkoutUrl: session.checkout_url },
  });
}

export async function previewPlanChange(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { planTier } = req.validated.body;
  const targetPlan = await prisma.plan.findUnique({ where: { tier: planTier } });
  if (!targetPlan) throw new ApiError(400, "Unknown plan");
  const subscription = await getOrCreateSubscription(employerProfile.id);

  if (!subscription.gatewaySubscriptionId || targetPlan.priceSar === 0) {
    return sendSuccess(res, {
      message: "Preview",
      data: { baseSar: targetPlan.priceSar, taxSar: 0, discountSar: 0, totalSar: targetPlan.priceSar, immediate: true },
    });
  }

  const preview = await dodoService.previewChangePlan({ subscription, targetPlan });
  const summary = preview.immediate_charge.summary;
  return sendSuccess(res, {
    message: "Preview",
    data: {
      baseSar: dodoService.fromHalalas(summary.total_amount - (summary.tax ?? 0)),
      taxSar: dodoService.fromHalalas(summary.tax ?? 0),
      discountSar: 0,
      totalSar: dodoService.fromHalalas(summary.total_amount),
      effectiveAt: preview.immediate_charge.effective_at,
      immediate: true,
    },
  });
}

export async function changePlan(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { planTier } = req.validated.body;
  const targetPlan = await prisma.plan.findUnique({ where: { tier: planTier } });
  if (!targetPlan) throw new ApiError(400, "Unknown plan");
  const subscription = await getOrCreateSubscription(employerProfile.id);

  if (targetPlan.priceSar === 0) {
    if (subscription.gatewaySubscriptionId) {
      await dodoService.cancelSubscription(subscription);
      await prisma.employerSubscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      });
      return sendSuccess(res, {
        message: "Your plan will move to Free at the end of the current billing period",
        data: null,
      });
    }
    await prisma.employerSubscription.update({ where: { id: subscription.id }, data: { planTier: "FREE" } });
    return sendSuccess(res, { message: "Switched to the Free plan", data: null });
  }

  const invoice = await prisma.invoice.create({
    data: {
      employerProfileId: employerProfile.id,
      type: "SUBSCRIPTION",
      amountSar: targetPlan.priceSar,
      status: "PENDING",
      note: `${targetPlan.name} plan`,
    },
  });
  const metadata = { employerProfileId: String(employerProfile.id), invoiceId: String(invoice.id) };

  if (!subscription.gatewaySubscriptionId) {
    const checkout = await withInvoiceCleanup(invoice.id, () =>
      dodoService.createSubscriptionCheckout({
        employerProfile,
        contactEmail: resolveContactEmail(employerProfile, req),
        targetPlan,
        returnUrl: `${env.FRONTEND_URL}/employer/billing`,
        metadata,
      }),
    );
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { gatewaySubscriptionId: checkout.subscription_id },
    });
    return sendSuccess(res, {
      statusCode: 201,
      message: "Checkout created — complete payment to activate your plan",
      data: { invoice, checkoutUrl: checkout.payment_link },
    });
  }

  await withInvoiceCleanup(invoice.id, () => dodoService.changePlan({ subscription, targetPlan, metadata }));
  return sendSuccess(res, {
    message: "Plan change submitted — this will be confirmed shortly",
    data: { invoice },
  });
}

export async function payInvoiceNow(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { id } = req.validated.params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, employerProfileId: employerProfile.id, status: "PENDING" },
  });
  if (!invoice) throw new ApiError(404, "Pending invoice not found");
  const subscription = await getOrCreateSubscription(employerProfile.id);
  const metadata = { employerProfileId: String(employerProfile.id), invoiceId: String(invoice.id) };

  if (invoice.type === "CREDIT_PACK") {
    if (!CREDIT_PACK_DODO_PRODUCT_ID) throw new ApiError(503, "Credit purchases aren't configured yet");
    const credits = Math.round(invoice.amountSar / PRICE_PER_CREDIT_SAR);
    const session = await dodoService.createCreditPackCheckout({
      employerProfile,
      contactEmail: resolveContactEmail(employerProfile, req),
      creditProductId: CREDIT_PACK_DODO_PRODUCT_ID,
      quantity: credits,
      metadata: { ...metadata, kind: "CREDIT_PACK", credits: String(credits) },
    });
    return sendSuccess(res, { message: "Checkout created", data: { checkoutUrl: session.checkout_url } });
  }

  const plan = await prisma.plan.findFirst({ where: { priceSar: invoice.amountSar, tier: subscription.planTier } });
  const targetPlan = plan ?? (await prisma.plan.findFirst({ where: { priceSar: invoice.amountSar } }));
  if (!targetPlan) throw new ApiError(400, "Couldn't determine which plan this invoice is for");

  const checkout = await dodoService.createSubscriptionCheckout({
    employerProfile,
    contactEmail: resolveContactEmail(employerProfile, req),
    targetPlan,
    returnUrl: `${env.FRONTEND_URL}/employer/billing`,
    metadata,
  });
  await prisma.employerSubscription.update({
    where: { id: subscription.id },
    data: { gatewaySubscriptionId: checkout.subscription_id },
  });
  return sendSuccess(res, { message: "Checkout created", data: { checkoutUrl: checkout.payment_link } });
}

export async function updatePaymentMethod(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);
  const session = await dodoService.createPaymentMethodUpdateSession({
    subscription,
    returnUrl: `${env.FRONTEND_URL}/employer/billing`,
  });
  return sendSuccess(res, {
    message: "Payment method update session created",
    data: { checkoutUrl: session.payment_link },
  });
}

export async function updateBillingProfile(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const updated = await prisma.employerProfile.update({
    where: { id: employerProfile.id },
    data: req.validated.body,
  });
  return sendSuccess(res, { message: "Billing profile updated", data: updated });
}

export async function requestRefund(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { id } = req.validated.params;
  const { reason } = req.validated.body;

  const original = await prisma.invoice.findFirst({
    where: { id, employerProfileId: employerProfile.id, status: "PAID" },
  });
  if (!original) throw new ApiError(404, "Paid invoice not found");

  const refund = await prisma.invoice.create({
    data: {
      employerProfileId: employerProfile.id,
      type: "REFUND",
      amountSar: original.amountSar,
      status: "REFUND_REQUESTED",
      note: reason || `Refund request for invoice #${original.id}`,
      refundsInvoiceId: original.id,
    },
  });
  await notifyAdmins({
    type: "REFUND_REQUESTED",
    title: "Refund request",
    message: `${employerProfile.companyName} requested a refund on invoice #${original.id}.`,
    link: "/admin/refunds",
  });

  return sendSuccess(res, { statusCode: 201, message: "Refund requested", data: refund });
}

export async function cancelSubscription(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);

  if (subscription.planTier === "FREE") throw new ApiError(400, "No paid subscription to cancel");
  if (subscription.cancelAtPeriodEnd) throw new ApiError(400, "Cancellation is already scheduled");

  if (subscription.gatewaySubscriptionId) {
    await dodoService.cancelSubscription(subscription);
  }
  const updated = await prisma.employerSubscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });
  await notify({
    userId: req.user.id,
    type: "CANCELLATION_SCHEDULED",
    title: "Cancellation scheduled",
    message: "Your subscription will not renew after the current billing period.",
    link: "/employer/billing",
  });
  await notifyAdmins({
    type: "SUBSCRIPTION_CANCELLED",
    title: "Subscription cancelled",
    message: `${employerProfile.companyName} scheduled their subscription to cancel.`,
    link: "/admin/billing",
  });

  return sendSuccess(res, { message: "Your plan will not renew after the current period", data: updated });
}

export async function resumeSubscription(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);

  if (!subscription.cancelAtPeriodEnd) throw new ApiError(400, "This subscription isn't scheduled for cancellation");

  if (subscription.gatewaySubscriptionId) {
    await dodoService.resumeSubscription(subscription);
  }
  const updated = await prisma.employerSubscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: false },
  });

  return sendSuccess(res, { message: "Cancellation reversed — your plan will continue to renew", data: updated });
}
