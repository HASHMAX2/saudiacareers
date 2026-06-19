import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validation/authSchemas.js";

export const authRouter = Router();

authRouter.use(authRateLimiter);
authRouter.post("/register", validate(registerSchema), asyncHandler(register));
authRouter.post("/login", validate(loginSchema), asyncHandler(login));
authRouter.post("/logout", asyncHandler(logout));
authRouter.post("/refresh-token", asyncHandler(refreshToken));
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(resetPassword),
);
authRouter.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(changePassword),
);

