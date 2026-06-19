import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!RESUME_MIME_TYPES.has(file.mimetype)) {
      return callback(new ApiError(422, "Resume must be a PDF, DOC, or DOCX file"));
    }
    return callback(null, true);
  },
});

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.mimetype)) {
      return callback(new ApiError(422, "Profile photo must be JPEG, PNG, or WebP"));
    }
    return callback(null, true);
  },
});
