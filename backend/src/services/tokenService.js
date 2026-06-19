import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const REFRESH_COOKIE_NAME = "refreshToken";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      type: "access",
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

export async function createRefreshToken(user) {
  const token = jwt.sign(
    {
      sub: String(user.id),
      type: "refresh",
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );
  const decoded = jwt.decode(token);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  return token;
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (payload.type !== "access") {
    throw new ApiError(401, "Invalid access token");
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (payload.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token");
  }
  return payload;
}

export async function findActiveRefreshToken(token) {
  const record = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!record) {
    throw new ApiError(401, "Refresh token is invalid or expired");
  }

  return record;
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
    ...(env.isProduction && env.COOKIE_DOMAIN
      ? { domain: env.COOKIE_DOMAIN }
      : {}),
  };
}

export function getRefreshCookieClearOptions() {
  const { maxAge: _maxAge, ...options } = getRefreshCookieOptions();
  return options;
}

