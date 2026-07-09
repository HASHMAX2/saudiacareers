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
