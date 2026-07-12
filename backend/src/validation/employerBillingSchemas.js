import { PlanTier } from "@prisma/client";
import { z } from "zod";

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

const bodyOnly = (body) => envelope(body);

export const invoicesQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const transactionsQuerySchema = invoicesQuerySchema;

export const creditPurchaseSchema = bodyOnly(
  z.object({
    credits: z.coerce.number().int().min(1).max(100),
  }).strict(),
);

export const planChangeSchema = bodyOnly(
  z.object({
    planTier: z.nativeEnum(PlanTier),
  }).strict(),
);

export const refundRequestSchema = envelope(
  z.object({ reason: z.string().trim().max(500).optional() }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const invoiceIdParamSchema = envelope(
  z.object({}).passthrough(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const billingProfileSchema = bodyOnly(
  z.object({
    taxRegistrationNumber: z.string().trim().max(50).optional().or(z.literal("")),
    billingEmail: z.string().trim().email().optional().or(z.literal("")),
    billingAddressLine1: z.string().trim().max(200).optional().or(z.literal("")),
    billingAddressLine2: z.string().trim().max(200).optional().or(z.literal("")),
    billingCity: z.string().trim().max(100).optional().or(z.literal("")),
    billingState: z.string().trim().max(100).optional().or(z.literal("")),
    billingPostalCode: z.string().trim().max(20).optional().or(z.literal("")),
    billingCountry: z.string().trim().length(2).optional().or(z.literal("")),
  }).strict(),
);
