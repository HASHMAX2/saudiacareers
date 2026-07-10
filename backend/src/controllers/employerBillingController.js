import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma.js";
import { PRICE_PER_CREDIT_SAR } from "../config/plans.js";
import { getOrCreateSubscription } from "../services/employerBillingService.js";
import { notify, notifyAdmins } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const INVOICE_TYPE_LABELS = { SUBSCRIPTION: "Plan subscription", CREDIT_PACK: "Job credit pack", REFUND: "Refund" };

async function requireEmployerProfile(userId) {
  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
  if (!employerProfile) throw new ApiError(404, "Employer profile not found");
  return employerProfile;
}

export async function getSubscription(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);
  const plans = await prisma.plan.findMany({ orderBy: { priceSar: "asc" } });
  return sendSuccess(res, {
    message: "Subscription retrieved",
    data: { subscription, plans, pricePerCreditSar: PRICE_PER_CREDIT_SAR },
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

export async function downloadInvoicePdf(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { id } = req.validated.params;
  const invoice = await prisma.invoice.findFirst({ where: { id, employerProfileId: employerProfile.id } });
  if (!invoice) throw new ApiError(404, "Invoice not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.id}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

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

  doc.end();
}

export async function requestCreditPurchase(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { credits } = req.validated.body;

  const invoice = await prisma.invoice.create({
    data: {
      employerProfileId: employerProfile.id,
      type: "CREDIT_PACK",
      amountSar: credits * PRICE_PER_CREDIT_SAR,
      status: "PENDING",
      note: `${credits} job credit${credits === 1 ? "" : "s"}`,
    },
  });
  await notify({
    userId: req.user.id,
    type: "INVOICE_AVAILABLE",
    title: "Invoice available",
    message: `Invoice #${invoice.id} for ${invoice.amountSar} SAR is available.`,
    link: "/employer/billing",
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Credit purchase requested — an admin will confirm payment and grant your credits",
    data: invoice,
  });
}

export async function requestPlanChange(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { planTier } = req.validated.body;
  const plan = await prisma.plan.findUnique({ where: { tier: planTier } });
  if (!plan) throw new ApiError(400, "Unknown plan");

  if (plan.priceSar === 0) {
    const subscription = await getOrCreateSubscription(employerProfile.id);
    await prisma.employerSubscription.update({
      where: { id: subscription.id },
      data: { planTier: "FREE", cancelAtPeriodEnd: false },
    });
    return sendSuccess(res, { message: "Switched to the Free plan", data: null });
  }

  const invoice = await prisma.invoice.create({
    data: {
      employerProfileId: employerProfile.id,
      type: "SUBSCRIPTION",
      amountSar: plan.priceSar,
      status: "PENDING",
      note: `${plan.name} plan subscription`,
    },
  });
  await notify({
    userId: req.user.id,
    type: "INVOICE_AVAILABLE",
    title: "Invoice available",
    message: `Invoice #${invoice.id} for ${invoice.amountSar} SAR is available.`,
    link: "/employer/billing",
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Plan change requested — an admin will confirm payment and activate your plan",
    data: invoice,
  });
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
    },
  });
  await notifyAdmins({
    type: "REFUND_REQUESTED",
    title: "Refund/cancellation request",
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

  const updated = await prisma.employerSubscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: false },
  });

  return sendSuccess(res, { message: "Cancellation reversed — your plan will continue to renew", data: updated });
}
