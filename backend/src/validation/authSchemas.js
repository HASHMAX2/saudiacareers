import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

const saudiMobile = z
  .string()
  .regex(/^\+966\d{9}$/, "Mobile must use the format +966XXXXXXXXX");

const bodyOnly = (body) =>
  z.object({
    body,
    params: z.object({}).passthrough(),
    query: z.object({}).passthrough(),
  });

export const registerSchema = bodyOnly(
  z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().transform((value) => value.toLowerCase()),
      mobile: saudiMobile,
      password,
    })
    .strict(),
);

export const loginSchema = bodyOnly(
  z
    .object({
      email: z.string().trim().email().transform((value) => value.toLowerCase()),
      password: z.string().min(1),
    })
    .strict(),
);

export const forgotPasswordSchema = bodyOnly(
  z
    .object({
      email: z.string().trim().email().transform((value) => value.toLowerCase()),
    })
    .strict(),
);

export const resetPasswordSchema = bodyOnly(
  z
    .object({
      token: z.string().min(32),
      password,
    })
    .strict(),
);

export const changePasswordSchema = bodyOnly(
  z
    .object({
      currentPassword: z.string().min(1),
      newPassword: password,
    })
    .strict()
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from the current password",
      path: ["newPassword"],
    }),
);

