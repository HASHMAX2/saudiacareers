import { Prisma } from "@prisma/client";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode ?? 500;
  let message = error.message ?? "Internal server error";
  let details = error.details;

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    statusCode = 409;
    message = "A record with these details already exists";
    details = error.meta?.target;
  }

  if (error instanceof multer.MulterError) {
    statusCode = 422;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the allowed size"
        : "Invalid file upload";
  }

  if (statusCode >= 500) {
    console.error(error);
    message = "Internal server error";
    details = undefined;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
