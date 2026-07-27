import { z } from "zod";
import { COUNTRIES } from "../utils/countries.js";

const mobile = z.string().regex(/^\+\d{7,15}$/);
const optionalText = (max) =>
  z.union([z.string().trim().max(max), z.literal("")]).optional();
const optionalUrl = z
  .union([z.string().trim().url().max(500), z.literal("")])
  .optional();

export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Separated", "Widowed", "Prefer not to say"];

export const WORK_AUTHORIZATION_STATUSES = [
  "Yes — Saudi citizen",
  "Yes — GCC citizen",
  "Yes — valid Iqama and work permit",
  "Yes — dependent Iqama",
  "No — I require employer sponsorship",
  "Other",
];

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rejects malformed strings AND calendar-invalid dates (e.g. 2024-02-30), without ever
// constructing a timezone-sensitive Date object — this stays a plain string end-to-end.
const dateOfBirth = z
  .union([
    z.string().regex(DATE_ONLY_RE).refine((value) => {
      const [year, month, day] = value.split("-").map(Number);
      if (year < 1900 || year > new Date().getFullYear()) return false;
      const d = new Date(Date.UTC(year, month - 1, day));
      return (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() === month - 1 &&
        d.getUTCDate() === day &&
        d.getTime() <= Date.now()
      );
    }, "Enter a valid date of birth"),
    z.literal(""),
  ])
  .optional();

export const updateProfileSchema = z.object({
  body: z
    .object({
      displayName: optionalText(100),
      mobile: mobile.optional(),
      country: z.union([z.enum(COUNTRIES), z.literal("")]).optional(),
      city: optionalText(100),
      designation: optionalText(150),
      experience: optionalText(100),
      skills: optionalText(1000),
      itSkills: optionalText(1000),
      cvHeadline: optionalText(200),
      education: optionalText(500),
      summary: optionalText(2000),
      industry: optionalText(100),
      functionalArea: optionalText(150),
      currentSalary: optionalText(100),
      gender: optionalText(50),
      nationality: optionalText(100),
      dateOfBirth,
      maritalStatus: z.union([z.enum(MARITAL_STATUSES), z.literal("")]).optional(),
      drivingLicense: optionalText(100),
      languagesKnown: optionalText(500),
      visaStatus: z.union([z.enum(WORK_AUTHORIZATION_STATUSES), z.literal("")]).optional(),
      religion: optionalText(100),
      alternateEmail: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
      alternateMobile: z.union([z.string().regex(/^\+\d{7,15}$/), z.literal("")]).optional(),
      linkedInUrl: optionalUrl,
      githubUrl: optionalUrl,
      portfolioUrl: optionalUrl,
      desiredJobTitle: optionalText(150),
      desiredLocation: optionalText(100),
      availabilityToJoin: optionalText(100),
    })
    .strict()
    .refine((body) => !(body.city && !body.country), {
      message: "Select a country before entering a city",
      path: ["city"],
    }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const addEmploymentSchema = z.object({
  body: z
    .object({
      jobTitle: z.string().trim().min(1).max(150),
      companyName: z.string().trim().min(1).max(150),
      startMonth: z.number().int().min(1).max(12).optional().nullable(),
      startYear: z.number().int().min(1950).max(2100),
      endMonth: z.number().int().min(1).max(12).optional().nullable(),
      endYear: z.number().int().min(1950).max(2100).optional().nullable(),
      isCurrent: z.boolean().default(false),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateEmploymentSchema = z.object({
  body: z
    .object({
      jobTitle: z.string().trim().min(1).max(150).optional(),
      companyName: z.string().trim().min(1).max(150).optional(),
      startMonth: z.number().int().min(1).max(12).optional().nullable(),
      startYear: z.number().int().min(1950).max(2100).optional(),
      endMonth: z.number().int().min(1).max(12).optional().nullable(),
      endYear: z.number().int().min(1950).max(2100).optional().nullable(),
      isCurrent: z.boolean().optional(),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const addEducationSchema = z.object({
  body: z
    .object({
      degree: z.string().trim().min(1).max(150),
      institution: z.string().trim().min(1).max(150),
      fieldOfStudy: z.string().trim().max(150).optional(),
      startYear: z.number().int().min(1950).max(2100).optional().nullable(),
      endYear: z.number().int().min(1950).max(2100).optional().nullable(),
      isCurrent: z.boolean().default(false),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateEducationSchema = z.object({
  body: z
    .object({
      degree: z.string().trim().min(1).max(150).optional(),
      institution: z.string().trim().min(1).max(150).optional(),
      fieldOfStudy: z.string().trim().max(150).optional(),
      startYear: z.number().int().min(1950).max(2100).optional().nullable(),
      endYear: z.number().int().min(1950).max(2100).optional().nullable(),
      isCurrent: z.boolean().optional(),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const addCertificationSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200),
      issuingOrg: z.string().trim().max(150).optional(),
      issueYear: z.number().int().min(1950).max(2100).optional().nullable(),
      credentialUrl: optionalUrl,
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateCertificationSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200).optional(),
      issuingOrg: z.string().trim().max(150).optional(),
      issueYear: z.number().int().min(1950).max(2100).optional().nullable(),
      credentialUrl: optionalUrl,
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});
