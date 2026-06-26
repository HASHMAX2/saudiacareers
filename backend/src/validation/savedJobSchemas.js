import { z } from "zod";

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

export const saveJobSchema = envelope(
  z.object({ jobId: z.coerce.number().int().positive() }).strict(),
);

export const savedJobIdSchema = envelope(
  z.object({}).passthrough(),
  z.object({ jobId: z.coerce.number().int().positive() }),
);
