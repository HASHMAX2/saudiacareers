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

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Browsers/OSes sometimes send a generic type for .xlsx — the controller
  // double-checks the actual file signature before parsing, so this is only
  // a first-pass filter, not the authoritative check.
  "application/octet-stream",
]);

export const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!EXCEL_MIME_TYPES.has(file.mimetype) && !file.originalname.toLowerCase().endsWith(".xlsx")) {
      return callback(new ApiError(422, "File must be an Excel .xlsx spreadsheet"));
    }
    return callback(null, true);
  },
});

// Verification documents must be PDF only — no images or Word docs — so KYB
// reviewers always see a consistent, non-editable format.
export const verificationDocUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (file.mimetype !== "application/pdf") {
      return callback(new ApiError(422, "Verification document must be a PDF file"));
    }
    return callback(null, true);
  },
});
