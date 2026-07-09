import { prisma } from "../config/prisma.js";
import { PLAN_LIST, PLANS, PRICE_PER_CREDIT_SAR } from "../config/plans.js";
import { getOrCreateSubscription } from "../services/employerBillingService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

async function requireEmployerProfile(userId) {
  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } });
  if (!employerProfile) throw new ApiError(404, "Employer profile not found");
  return employerProfile;
}

export async function getSubscription(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);
  return sendSuccess(res, {
    message: "Subscription retrieved",
    data: { subscription, plans: PLAN_LIST, pricePerCreditSar: PRICE_PER_CREDIT_SAR },
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

  return sendSuccess(res, {
    statusCode: 201,
    message: "Credit purchase requested — an admin will confirm payment and grant your credits",
    data: invoice,
  });
}

export async function requestPlanChange(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const { planTier } = req.validated.body;
  const plan = PLANS[planTier];
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

  return sendSuccess(res, { statusCode: 201, message: "Refund requested", data: refund });
}

export async function cancelSubscription(req, res) {
  const employerProfile = await requireEmployerProfile(req.user.id);
  const subscription = await getOrCreateSubscription(employerProfile.id);

  await prisma.employerSubscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  return sendSuccess(res, { message: "Your plan will not renew after the current period" });
}
