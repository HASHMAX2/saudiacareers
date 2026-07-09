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
    q: z.string().trim().max(200).optional(),
    locations: csvString,
    industries: csvString,
    employmentTypes: csvString,
    experiences: csvString,
    salaries: csvString,
    genders: csvString,
    nationalities: csvString,
    postedAfter: z.string().trim().optional(),
    postedBefore: z.string().trim().optional(),
    sort: z.enum(["newest", "deadline"]).default("newest"),
  }),
});

export const jobReportSchema = z.object({
  body: z.object({
    reason: z.enum(["MISLEADING_SALARY", "SUSPICIOUS_CONTACT", "DUPLICATE_LISTING", "SCAM_OR_FRAUD", "OTHER"]),
    note: z.string().trim().max(500).optional(),
  }).strict(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.object({}).passthrough(),
});

export const filterOptionsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});
