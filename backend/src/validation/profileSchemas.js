import { z } from "zod";

const mobile = z.string().regex(/^\+\d{7,15}$/);
const optionalText = (max) =>
  z.union([z.string().trim().max(max), z.literal("")]).optional();
const optionalUrl = z
  .union([z.string().trim().url().max(500), z.literal("")])
  .optional();

export const updateProfileSchema = z.object({
  body: z
    .object({
      displayName: optionalText(100),
      mobile: mobile.optional(),
      location: z.enum(["Riyadh", "Jeddah", "Dammam", "Other"]).optional(),
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
      dateOfBirth: optionalText(50),
      maritalStatus: optionalText(50),
      drivingLicense: optionalText(100),
      languagesKnown: optionalText(500),
      visaStatus: optionalText(100),
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
    .strict(),
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
