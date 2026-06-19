import { z } from "zod";

export const jobIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.object({}).passthrough(),
});

export const listJobsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    industry: z.string().trim().max(100).optional(),
    experience: z.string().trim().max(100).optional(),
    employmentType: z.string().trim().max(100).optional(),
    sort: z.enum(["newest", "deadline"]).default("newest"),
  }),
});

