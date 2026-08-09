import { z } from "zod";

export const companyParamsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    type: z.enum(["employer", "lead"]),
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).passthrough(),
});
