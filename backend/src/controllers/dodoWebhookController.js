import { prisma } from "../config/prisma.js";
import { verifyWebhook, fromHalalas } from "../services/dodoService.js";
import { notify, notifyAdmins } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// Dodo retries failed/unacknowledged deliveries, so every handler must be safe
// to run twice. We insert the event id first — a unique-constraint violation
// means we've already processed it, and we return 200 immediately without
// redoing any side effects.
async function claimEvent(id, eventType) {
  try {
    await prisma.dodoWebhookEvent.create({ data: { id, eventType } });
    return true;
  } catch (error) {
    if (error.code === "P2002") return false;
    throw error;
  }
}

async function findEmployerProfileId(metadata, subscriptionId) {
  if (metadata?.employerProfileId) return Number(metadata.employerProfileId);
  if (subscriptionId) {
    const sub = await prisma.employerSubscription.findFirst({
      where: { gatewaySubscriptionId: subscriptionId },
      select: { employerProfileId: true },
    });
    if (sub) return sub.employerProfileId;
  }
  return null;
}

// Plan changes/checkouts we initiate always stamp an invoiceId in metadata,
// so we update that existing PENDING row. Recurring auto-renewal charges are
// triggered by Dodo on its own schedule with no invoiceId — for those we
// create the invoice row here, since this webhook is the first time we learn
// the charge happened at all.
async function settleInvoice({ invoiceId, employerProfileId, invoiceType = "SUBSCRIPTION", amountSar, gatewayRef, status }) {
  if (invoiceId) {
    return prisma.invoice.update({
      where: { id: Number(invoiceId) },
      data: { status, gatewayRef, paidAt: status === "PAID" ? new Date() : undefined },
    });
  }
  if (!employerProfileId) return null;
  return prisma.invoice.create({
    data: {
      employerProfileId,
      type: invoiceType,
      amountSar,
      status,
      gatewayRef,
      paidAt: status === "PAID" ? new Date() : undefined,
    },
  });
}

async function recordTransaction({ employerProfileId, invoiceId, type, amountSar, status, gatewayRef }) {
  if (!employerProfileId) return;
  await prisma.transaction.create({
    data: {
      employerProfileId,
      invoiceId: invoiceId ? Number(invoiceId) : null,
      type,
      amountSar,
      status,
      gatewayRef,
    },
  });
}

async function notifyEmployer(employerProfileId, payload) {
  if (!employerProfileId) return;
  const profile = await prisma.employerProfile.findUnique({
    where: { id: employerProfileId },
    select: { userId: true },
  });
  if (profile) await notify({ userId: profile.userId, link: "/employer/billing", ...payload });
}

async function handlePaymentSucceeded(event) {
  const payment = event.data;
  const metadata = payment.metadata || {};
  const employerProfileId = await findEmployerProfileId(metadata, payment.subscription_id);
  const amountSar = fromHalalas(payment.total_amount);

  await settleInvoice({
    invoiceId: metadata.invoiceId,
    employerProfileId,
    invoiceType: metadata.kind === "CREDIT_PACK" ? "CREDIT_PACK" : "SUBSCRIPTION",
    amountSar,
    gatewayRef: payment.payment_id,
    status: "PAID",
  });
  await recordTransaction({
    employerProfileId,
    invoiceId: metadata.invoiceId,
    type: "CHARGE",
    amountSar,
    status: "succeeded",
    gatewayRef: payment.payment_id,
  });

  if (employerProfileId && metadata.kind === "CREDIT_PACK" && metadata.credits) {
    await prisma.employerSubscription.update({
      where: { employerProfileId },
      data: { paidCreditsRemaining: { increment: Number(metadata.credits) } },
    });
  }

  await notifyEmployer(employerProfileId, {
    type: "PAYMENT_SUCCESSFUL",
    title: "Payment received",
    message: `Your payment of ${amountSar} SAR was received successfully.`,
  });
}

async function handlePaymentFailed(event) {
  const payment = event.data;
  const metadata = payment.metadata || {};
  const employerProfileId = await findEmployerProfileId(metadata, payment.subscription_id);
  const amountSar = fromHalalas(payment.total_amount);

  await settleInvoice({
    invoiceId: metadata.invoiceId,
    employerProfileId,
    amountSar,
    gatewayRef: payment.payment_id,
    status: "FAILED",
  });
  await recordTransaction({
    employerProfileId,
    invoiceId: metadata.invoiceId,
    type: "FAILED_CHARGE",
    amountSar,
    status: "failed",
    gatewayRef: payment.payment_id,
  });

  await notifyEmployer(employerProfileId, {
    type: "PAYMENT_FAILED",
    title: "Payment failed",
    message: `Your payment of ${amountSar} SAR could not be processed. Please update your payment method.`,
  });
  await notifyAdmins({
    type: "PAYMENT_FAILED_FOR_COMPANY",
    title: "Employer payment failed",
    message: `A payment of ${amountSar} SAR failed for employer profile #${employerProfileId ?? "unknown"}.`,
    link: "/admin/billing",
  });
}

async function upsertSubscriptionFromGateway(event, { cancelAtPeriodEnd } = {}) {
  const sub = event.data;
  const metadata = sub.metadata || {};
  const employerProfileId = await findEmployerProfileId(metadata, sub.subscription_id);
  if (!employerProfileId) return;

  const plan = sub.product_id
    ? await prisma.plan.findFirst({ where: { dodoProductId: sub.product_id } })
    : null;

  await prisma.employerSubscription.update({
    where: { employerProfileId },
    data: {
      gatewaySubscriptionId: sub.subscription_id,
      gatewayCustomerId: sub.customer?.customer_id ?? undefined,
      planTier: plan?.tier ?? undefined,
      currentPeriodStart: sub.previous_billing_date ? new Date(sub.previous_billing_date) : undefined,
      renewsAt: sub.next_billing_date ? new Date(sub.next_billing_date) : undefined,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? sub.cancel_at_next_billing_date ?? undefined,
      ...(plan ? { paidCreditsRemaining: plan.paidCreditsGranted } : {}),
    },
  });

  return employerProfileId;
}

async function handleSubscriptionActive(event) {
  const employerProfileId = await upsertSubscriptionFromGateway(event);
  await notifyEmployer(employerProfileId, {
    type: "SUBSCRIPTION_ACTIVATED",
    title: "Subscription active",
    message: "Your subscription is now active.",
  });
}

async function handleSubscriptionOnHold(event) {
  const employerProfileId = await upsertSubscriptionFromGateway(event);
  await notifyEmployer(employerProfileId, {
    type: "SUBSCRIPTION_ON_HOLD",
    title: "Subscription on hold",
    message: "Your subscription payment is overdue and access is on hold. Please update your payment method.",
  });
}

async function handleSubscriptionPlanChanged(event) {
  const employerProfileId = await upsertSubscriptionFromGateway(event);
  await notifyEmployer(employerProfileId, {
    type: "PLAN_CHANGED",
    title: "Plan changed",
    message: "Your subscription plan has been updated.",
  });
}

async function handleSubscriptionUpdated(event) {
  await upsertSubscriptionFromGateway(event);
}

async function handleSubscriptionCanceled(event) {
  const employerProfileId = await upsertSubscriptionFromGateway(event, { cancelAtPeriodEnd: false });
  if (employerProfileId) {
    await prisma.employerSubscription.update({
      where: { employerProfileId },
      data: { planTier: "FREE", gatewaySubscriptionId: null, paidCreditsRemaining: 0 },
    });
  }
  await notifyEmployer(employerProfileId, {
    type: "SUBSCRIPTION_CANCELLED",
    title: "Subscription canceled",
    message: "Your subscription has ended and your account is now on the Free Plan.",
  });
  await notifyAdmins({
    type: "SUBSCRIPTION_CANCELLED",
    title: "Employer subscription canceled",
    message: `Employer profile #${employerProfileId ?? "unknown"} canceled their subscription.`,
    link: "/admin/billing",
  });
}

async function handleRefundSucceeded(event) {
  const refund = event.data;
  const metadata = refund.metadata || {};
  const employerProfileId = await findEmployerProfileId(metadata, null);
  const amountSar = fromHalalas(refund.amount ?? 0);

  await settleInvoice({
    invoiceId: metadata.invoiceId,
    employerProfileId,
    invoiceType: "REFUND",
    amountSar,
    gatewayRef: refund.refund_id,
    status: "REFUNDED",
  });
  await recordTransaction({
    employerProfileId,
    invoiceId: metadata.invoiceId,
    type: "REFUND",
    amountSar,
    status: "succeeded",
    gatewayRef: refund.refund_id,
  });

  await notifyEmployer(employerProfileId, {
    type: "REFUND_SUCCEEDED",
    title: "Refund issued",
    message: `Your refund of ${amountSar} SAR has been processed.`,
  });
}

async function handleRefundFailed(event) {
  const refund = event.data;
  const metadata = refund.metadata || {};
  const employerProfileId = await findEmployerProfileId(metadata, null);
  await notifyAdmins({
    type: "REFUND_FAILED",
    title: "Refund failed",
    message: `A refund attempt failed for employer profile #${employerProfileId ?? "unknown"}. Check the Dodo dashboard.`,
    link: "/admin/billing",
  });
}

const HANDLERS = {
  "payment.succeeded": handlePaymentSucceeded,
  "payment.failed": handlePaymentFailed,
  "subscription.active": handleSubscriptionActive,
  "subscription.on_hold": handleSubscriptionOnHold,
  "subscription.plan_changed": handleSubscriptionPlanChanged,
  "subscription.updated": handleSubscriptionUpdated,
  "subscription.cancelled": handleSubscriptionCanceled,
  "refund.succeeded": handleRefundSucceeded,
  "refund.failed": handleRefundFailed,
};

export async function handleDodoWebhook(req, res) {
  if (!req.rawBody) throw new ApiError(400, "Missing request body");

  let event;
  try {
    event = verifyWebhook(req.rawBody.toString("utf8"), req.headers);
  } catch {
    throw new ApiError(400, "Invalid webhook signature");
  }

  const eventId = req.headers["webhook-id"];
  const isNew = await claimEvent(eventId, event.type);
  if (isNew) {
    const handler = HANDLERS[event.type];
    if (handler) await handler(event);
  }

  return sendSuccess(res, { message: "Webhook processed" });
}
