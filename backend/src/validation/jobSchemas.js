import { z } from "zod";

export const jobIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.object({}).passthrough(),
});

const csvString = z.string().trim().max(2000).optional();

export const listJobsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    locations: csvString,
    industries: csvString,
    employmentTypes: csvString,
    experiences: csvString,
    genders: csvString,
    nationalities: csvString,
    postedAfter: z.string().trim().optional(),
    postedBefore: z.string().trim().optional(),
    sort: z.enum(["newest", "deadline"]).default("newest"),
  }),
});

export const filterOptionsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});
