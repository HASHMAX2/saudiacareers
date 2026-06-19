import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../services/tokenService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  let payload;
  try {
    payload = verifyAccessToken(authorization.slice(7));
  } catch {
    throw new ApiError(401, "Access token is invalid or expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      mustChangePassword: true,
    },
  });

  if (!user) throw new ApiError(401, "User no longer exists");
  req.user = user;
  next();
});

