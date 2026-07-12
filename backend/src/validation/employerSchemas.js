import { JobStatus } from "@prisma/client";
import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

const bodyOnly = (body) => envelope(body);

export const employerRegisterSchema = bodyOnly(
  z.object({
    name: z.string().trim().min(2).max(100),
    companyName: z.string().trim().min(2).max(150),
    email: z.string().trim().email().transform((v) => v.toLowerCase()),
    password,
    phone: z
      .string()
      .regex(/^\+\d{7,15}$/, "Include country code e.g. +966512345678")
      .optional(),
    industry: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    website: z.string().trim().url("Enter a valid URL").max(255).optional().or(z.literal("")),
    companySize: z.string().trim().max(50).optional(),
    contactDesignation: z.string().trim().max(100).optional(),
  }).strict(),
);

export const employerProfileSchema = bodyOnly(
  z.object({
    companyName: z.string().trim().min(2).max(150),
    industry: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    website: z.string().trim().url("Enter a valid URL").max(255).optional().or(z.literal("")),
    linkedinUrl: z.string().trim().url("Enter a valid URL").max(255).optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^\+\d{7,15}$/, "Include country code e.g. +966512345678")
      .optional()
      .or(z.literal("")),
    description: z.string().trim().max(2000).optional(),
  }).strict(),
);

export const employerJobQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.nativeEnum(JobStatus).optional(),
  }),
);

export const employerAllApplicationsQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    jobId: z.coerce.number().int().positive().optional(),
    status: z.enum(["APPLIED", "SHORTLISTED", "ON_HOLD", "REJECTED"]).optional(),
  }),
);

export const employerJobApplicationsQuerySchema = envelope(
  z.object({}).passthrough(),
  z.object({ jobId: z.coerce.number().int().positive() }),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["APPLIED", "SHORTLISTED", "ON_HOLD", "REJECTED"]).optional(),
  }),
);

export const employerApplicationStatusSchema = envelope(
  z.object({ status: z.enum(["APPLIED", "SHORTLISTED", "ON_HOLD", "REJECTED"]) }).strict(),
  z.object({ id: z.coerce.number().int().positive() }),
);

export const enquirySchema = bodyOnly(
  z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().transform((v) => v.toLowerCase()),
    company: z.string().trim().max(150).optional(),
    subject: z.string().trim().min(3).max(200),
    message: z.string().trim().min(10).max(5000),
  }).strict(),
);

export const VERIFICATION_DOCUMENT_TYPES = [
  "REGISTRATION_CERTIFICATE",
  "TAX_REGISTRATION",
  "AUTHORIZED_PERSON_ID",
  "ADDRESS_PROOF",
  "AUTHORIZATION_LETTER",
];

// multer parses the multipart body before this runs, so documentType arrives
// as a normal req.body string field alongside req.file.
export const verificationDocumentUploadSchema = bodyOnly(
  z.object({
    documentType: z.enum(VERIFICATION_DOCUMENT_TYPES),
  }).strict(),
);

export const employerSupportRequestSchema = bodyOnly(
  z.object({
    category: z.enum(["VERIFICATION", "PROFILE", "DOCUMENTS", "ACCOUNT", "OTHER"]),
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(5000),
  }).strict(),
);
