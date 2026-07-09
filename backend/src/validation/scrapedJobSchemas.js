import { ScrapedJobStatus } from "@prisma/client";
import { z } from "zod";

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

export const scrapedJobsQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.nativeEnum(ScrapedJobStatus).optional(),
  }),
);

export const createScrapedJobSchema = envelope(
  z.object({
    title: z.string().trim().min(2).max(150),
    companyName: z.string().trim().min(2).max(150),
    location: z.string().trim().max(100).optional(),
    source: z.string().trim().min(2).max(100),
    applyUrl: z.string().trim().url(),
  }).strict(),
);

export const scrapedJobIdSchema = envelope(
  z.object({}).passthrough(),
  z.object({ id: z.coerce.number().int().positive() }),
);
