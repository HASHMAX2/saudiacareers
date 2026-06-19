import { z } from "zod";

export const applySchema = z.object({
  body: z.object({ jobId: z.coerce.number().int().positive() }).strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

