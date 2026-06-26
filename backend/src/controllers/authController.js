import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { sendEmail } from "../services/emailService.js";
import { passwordResetEmailTemplate } from "../services/emailTemplates/passwordReset.js";
import { welcomeEmailTemplate } from "../services/emailTemplates/welcome.js";
import {
  REFRESH_COOKIE_NAME,
  createAccessToken,
  createRefreshToken,
  findActiveRefreshToken,
  getRefreshCookieClearOptions,
  getRefreshCookieOptions,
  hashToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
  verifyRefreshToken,
} from "../services/tokenService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
});

async function establishSession(res, user) {
  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(createAccessToken(user)),
    createRefreshToken(user),
  ]);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  return accessToken;
}

export async function register(req, res) {
  const { name, email, mobile, password } = req.validated.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      mobile,
      passwordHash,
      role: Role.CANDIDATE,
      profile: { create: {} },
    },
  });

  const accessToken = await establishSession(res, user);
  const template = welcomeEmailTemplate({ name: user.name });
  sendEmail({ to: user.email, ...template }).catch((error) => {
    console.error("Welcome email failed:", error.message);
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Registration successful",
    data: { user: publicUser(user), accessToken },
  });
}

export async function registerEmployer(req, res) {
  const { name, companyName, email, password, phone, industry, location, website, companySize, contactDesignation } = req.validated.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      mobile: phone ?? null,
      passwordHash,
      role: Role.EMPLOYER,
      employerProfile: {
        create: {
          companyName,
          phone: phone ?? null,
          industry: industry ?? null,
          location: location ?? null,
          website: website || null,
          companySize: companySize ?? null,
          contactDesignation: contactDesignation ?? null,
        },
      },
    },
  });

  const accessToken = await establishSession(res, user);
  const template = welcomeEmailTemplate({ name: user.name });
  sendEmail({ to: user.email, ...template }).catch((error) => {
    console.error("Employer welcome email failed:", error.message);
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Employer account created",
    data: { user: publicUser(user), accessToken },
  });
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = await establishSession(res, user);
  return sendSuccess(res, {
    message: "Login successful",
    data: { user: publicUser(user), accessToken },
  });
}

export async function logout(req, res) {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  await revokeRefreshToken(refreshToken);
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
  return sendSuccess(res, { message: "Logout successful" });
}

export async function refreshToken(req, res) {
  const currentToken = req.cookies[REFRESH_COOKIE_NAME];
  if (!currentToken) throw new ApiError(401, "Refresh token is required");

  try {
    verifyRefreshToken(currentToken);
  } catch {
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
    throw new ApiError(401, "Refresh token is invalid or expired");
  }

  const record = await findActiveRefreshToken(currentToken);
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = await establishSession(res, record.user);
  return sendSuccess(res, {
    message: "Session refreshed",
    data: { user: publicUser(record.user), accessToken },
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      }),
    ]);

    const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;
    const template = passwordResetEmailTemplate({ name: user.name, resetUrl });
    sendEmail({ to: user.email, ...template }).catch((error) => {
      console.error("Password reset email failed:", error.message);
    });
  }

  return sendSuccess(res, {
    message: "If an account exists for that email, a reset link has been sent",
  });
}

export async function resetPassword(req, res) {
  const { token, password } = req.validated.body;
  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!resetRecord) throw new ApiError(400, "Reset token is invalid or expired");

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: resetRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return sendSuccess(res, { message: "Password reset successful" });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      ...(user.role === Role.ADMIN ? { mustChangePassword: false } : {}),
    },
  });
  await revokeAllUserRefreshTokens(user.id);

  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  const accessToken = await establishSession(res, updatedUser);
  return sendSuccess(res, {
    message: "Password changed successfully",
    data: { user: publicUser(updatedUser), accessToken },
  });
}

