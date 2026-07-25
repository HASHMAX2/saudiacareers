import { ApplicationStatus, ApplyMethod, InvoiceStatus, JobStatus, PlanTier, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { isCompanyEmail } from "../utils/companyEmail.js";

const COMPANY_EMAIL_MESSAGE = "Please enter a valid company email address. Personal email providers are not allowed.";

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
  hrEmail: z.string().email().refine(isCompanyEmail, COMPANY_EMAIL_MESSAGE),
  gender: z.string().trim().max(50).nullable().optional(),
  nationality: z.string().trim().max(100).nullable().optional(),
  applicationDeadline: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  department: z.string().trim().max(100).nullable().optional(),
  workMode: z.string().trim().max(50).nullable().optional(),
  applyMethod: z.nativeEnum(ApplyMethod).optional(),
  applyContact: z.string().trim().max(255).nullable().optional(),
  screeningQuestion: z.string().trim().max(500).nullable().optional(),
  listingDurationDays: z.coerce.number().int().min(7).max(90).optional(),
  saveAsDraft: z.boolean().optional(),
});

// Only checked when both fields are present in this particular request body —
// applies equally to a full create and a partial update.
function refineApplyContactEmail(body) {
  if (body.applyMethod === "EMAIL" && body.applyContact) {
    return isCompanyEmail(body.applyContact);
  }
  return true;
}

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

export const createJobSchema = envelope(
  jobBody.strict().refine(refineApplyContactEmail, { message: COMPANY_EMAIL_MESSAGE, path: ["applyContact"] }),
);
export const updateJobSchema = envelope(
  jobBody.partial().strict()
    .refine((body) => Object.keys(body).length > 0)
    .refine(refineApplyContactEmail, { message: COMPANY_EMAIL_MESSAGE, path: ["applyContact"] }),
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
export const adminEmployersQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.union([z.nativeEnum(VerificationStatus), z.literal("SUSPENDED")]).optional(),
    planTier: z.nativeEnum(PlanTier).optional(),
  }),
);

export const suspendEmployerSchema = envelope(
  z.object({ reason: z.string().trim().min(3).max(500) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const adminCandidatesQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
  }),
);

export const candidateFeedbackSchema = envelope(
  z.object({ comments: z.string().trim().min(3).max(5000) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const updatePlanSchema = envelope(
  z.object({
    name: z.string().trim().min(2).max(100).optional(),
    priceSar: z.coerce.number().int().min(0).optional(),
    paidCreditsGranted: z.coerce.number().int().min(0).optional(),
    features: z.array(z.string().trim().min(1).max(200)).min(1).optional(),
    dodoProductId: z.string().trim().max(100).optional().or(z.literal("")),
  }).strict().refine((body) => Object.keys(body).length > 0),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const pendingVerificationsQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const billingOverviewQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
  }),
);

export const verificationDecisionSchema = envelope(
  z.object({ note: z.string().trim().max(500).optional() }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const rejectVerificationSchema = envelope(
  z.object({ note: z.string().trim().min(3).max(500) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const jobApprovalSchema = envelope(
  z.object({ note: z.string().trim().max(500).optional() }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const jobRejectionSchema = envelope(
  z.object({ note: z.string().trim().min(3).max(500) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const adminInvoicesQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.nativeEnum(InvoiceStatus).optional(),
  }),
);

export const invoiceIdSchema = envelope(
  z.object({}).passthrough(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const rejectRefundSchema = envelope(
  z.object({ reason: z.string().trim().min(3).max(500) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
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

