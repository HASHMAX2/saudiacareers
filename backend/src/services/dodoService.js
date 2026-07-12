import DodoPayments from "dodopayments";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

let client = null;

export function isDodoConfigured() {
  return Boolean(env.DODO_PAYMENTS_API_KEY);
}

function getClient() {
  if (!isDodoConfigured()) return null;
  if (!client) {
    client = new DodoPayments({
      bearerToken: env.DODO_PAYMENTS_API_KEY,
      webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
      environment: env.DODO_PAYMENTS_ENVIRONMENT,
    });
  }
  return client;
}

function requireClient() {
  const c = getClient();
  if (!c) throw new ApiError(503, "Payment gateway not configured");
  return c;
}

// Every SAR amount in our DB is a whole number of riyals. Dodo, like most
// gateways, expects amounts in the currency's smallest unit — halalas.
export const toHalalas = (sar) => Math.round(sar * 100);
export const fromHalalas = (halalas) => Math.round(halalas / 100);

function billingAddressFor(employerProfile) {
  return {
    street: employerProfile.billingAddressLine1 || employerProfile.location || "N/A",
    city: employerProfile.billingCity || employerProfile.location || "N/A",
    state: employerProfile.billingState || "N/A",
    zipcode: employerProfile.billingPostalCode || "00000",
    country: employerProfile.billingCountry || "SA",
  };
}

export async function previewChangePlan({ subscription, targetPlan }) {
  const c = requireClient();
  if (!targetPlan.dodoProductId) {
    throw new ApiError(503, "This plan isn't linked to a Dodo product yet — contact support");
  }
  if (!subscription.gatewaySubscriptionId) {
    throw new ApiError(409, "No active gateway subscription to preview a change against");
  }
  return c.subscriptions.previewChangePlan(subscription.gatewaySubscriptionId, {
    product_id: targetPlan.dodoProductId,
    proration_billing_mode: "prorated_immediately",
    quantity: 1,
  });
}

export async function changePlan({ subscription, targetPlan, prorationMode = "prorated_immediately", metadata }) {
  const c = requireClient();
  if (!targetPlan.dodoProductId) {
    throw new ApiError(503, "This plan isn't linked to a Dodo product yet — contact support");
  }
  if (!subscription.gatewaySubscriptionId) {
    throw new ApiError(409, "No active gateway subscription — start a checkout first");
  }
  await c.subscriptions.changePlan(subscription.gatewaySubscriptionId, {
    product_id: targetPlan.dodoProductId,
    proration_billing_mode: prorationMode,
    quantity: 1,
    metadata,
  });
}

export async function createSubscriptionCheckout({ employerProfile, contactEmail, targetPlan, returnUrl, metadata }) {
  const c = requireClient();
  if (!targetPlan.dodoProductId) {
    throw new ApiError(503, "This plan isn't linked to a Dodo product yet — contact support");
  }
  return c.subscriptions.create({
    billing: billingAddressFor(employerProfile),
    customer: {
      name: employerProfile.companyName,
      email: contactEmail,
    },
    product_id: targetPlan.dodoProductId,
    quantity: 1,
    payment_link: true,
    return_url: returnUrl,
    tax_id: employerProfile.taxRegistrationNumber || undefined,
    metadata,
  });
}

export async function cancelSubscription(subscription) {
  const c = requireClient();
  if (!subscription.gatewaySubscriptionId) {
    throw new ApiError(409, "No active gateway subscription to cancel");
  }
  await c.subscriptions.update(subscription.gatewaySubscriptionId, {
    cancel_at_next_billing_date: true,
  });
}

export async function resumeSubscription(subscription) {
  const c = requireClient();
  if (!subscription.gatewaySubscriptionId) {
    throw new ApiError(409, "No active gateway subscription to resume");
  }
  await c.subscriptions.update(subscription.gatewaySubscriptionId, {
    cancel_at_next_billing_date: false,
  });
}

export async function createPaymentMethodUpdateSession({ subscription, returnUrl }) {
  const c = requireClient();
  if (!subscription.gatewaySubscriptionId) {
    throw new ApiError(409, "No active gateway subscription — start a checkout first");
  }
  return c.subscriptions.updatePaymentMethod(subscription.gatewaySubscriptionId, {
    payment_method: { type: "new", return_url: returnUrl },
  });
}

export async function createCreditPackCheckout({ employerProfile, contactEmail, creditProductId, quantity, metadata }) {
  const c = requireClient();
  return c.checkoutSessions.create({
    product_cart: [{ product_id: creditProductId, quantity }],
    customer: {
      name: employerProfile.companyName,
      email: contactEmail,
    },
    billing_address: billingAddressFor(employerProfile),
    metadata,
  });
}

// Refunds are always issued against the full original payment — our billing
// model tracks refunds at invoice granularity, not per line item, so there's
// no `items` breakdown to pass here.
export async function createRefund({ paymentGatewayRef, reason, metadata }) {
  const c = requireClient();
  return c.refunds.create({ payment_id: paymentGatewayRef, reason, metadata });
}

export function verifyWebhook(rawBody, headers) {
  const c = requireClient();
  return c.webhooks.unwrap(rawBody, { headers });
}
