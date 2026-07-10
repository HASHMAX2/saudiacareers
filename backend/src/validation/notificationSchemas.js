import { z } from "zod";

const envelope = (body, params = z.object({}).passthrough(), query = z.object({}).passthrough()) =>
  z.object({ body, params, query });

export const listNotificationsSchema = envelope(
  z.object({}).passthrough(),
  z.object({}).passthrough(),
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
);

export const notificationIdSchema = envelope(
  z.object({}).passthrough(),
  z.object({ id: z.coerce.number().int().positive() }),
);
