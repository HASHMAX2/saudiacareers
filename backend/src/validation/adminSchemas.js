import { ApplicationStatus, JobStatus } from "@prisma/client";
import { z } from "zod";

const jobBody = z.object({
  title: z.string().trim().min(2).max(150),
  companyName: z.string().trim().min(2).max(150),
  location: z.string().trim().min(2).max(100),
  industry: z.string().trim().min(2).max(100),
  employmentType: z.string().trim().min(2).max(100),
  experienceRequired: z.string().trim().min(1).max(100),
  salaryRange: z.string().trim().max(100).nullable().optional(),
  description: z.string().trim().min(20).max(20000),
  requiredSkills: z.string().trim().min(1).max(2000),
  hrEmail: z.string().email(),
  applicationDeadline: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(JobStatus).optional(),
});

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

export const createJobSchema = envelope(jobBody.strict());
export const updateJobSchema = envelope(
  jobBody.partial().strict().refine((body) => Object.keys(body).length > 0),
  z.object({ id: z.coerce.number().int().positive() }),
);
export const adminIdSchema = envelope(
  z.object({}).passthrough(),
  z.object({ id: z.coerce.number().int().positive() }),
);
export const jobStatusSchema = envelope(
  z.object({ status: z.nativeEnum(JobStatus) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);
export const applicationStatusSchema = envelope(
  z.object({ status: z.nativeEnum(ApplicationStatus) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);
export const adminJobsQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.nativeEnum(JobStatus).optional(),
  }),
);
export const adminApplicationsQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(5000).default(20),
    search: z.string().trim().max(100).optional(),
    jobId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
    hrEmailStatus: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
  }),
);

