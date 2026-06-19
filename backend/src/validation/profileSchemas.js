import { z } from "zod";

const saudiMobile = z.string().regex(/^\+966\d{9}$/);
const optionalText = (max) =>
  z.union([z.string().trim().max(max), z.literal("")]).optional();

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      mobile: saudiMobile.optional(),
      location: z.enum(["Riyadh", "Jeddah", "Dammam", "Other"]).optional(),
      designation: optionalText(150),
      experience: optionalText(100),
      skills: optionalText(1000),
      education: optionalText(500),
      summary: optionalText(2000),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

