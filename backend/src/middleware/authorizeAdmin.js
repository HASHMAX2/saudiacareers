import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";

export function authorizeAdmin(req, _res, next) {
  if (req.user?.role !== Role.ADMIN) {
    return next(new ApiError(403, "Administrator access required"));
  }
  return next();
}

export function authorizeCandidate(req, _res, next) {
  if (req.user?.role !== Role.CANDIDATE) {
    return next(new ApiError(403, "Candidate access required"));
  }
  return next();
}

export function authorizeEmployer(req, _res, next) {
  if (req.user?.role !== Role.EMPLOYER) {
    return next(new ApiError(403, "Employer access required"));
  }
  return next();
}

export function requirePasswordChangeComplete(req, _res, next) {
  if (req.user?.role === Role.ADMIN && req.user.mustChangePassword) {
    return next(new ApiError(403, "Password change required", {
      code: "PASSWORD_CHANGE_REQUIRED",
    }));
  }
  return next();
}
