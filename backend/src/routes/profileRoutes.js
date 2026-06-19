import { Router } from "express";
import {
  deleteResume,
  deleteProfilePhoto,
  downloadResume,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  uploadResume,
} from "../controllers/profileController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeCandidate } from "../middleware/authorizeAdmin.js";
import { avatarUpload, resumeUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updateProfileSchema } from "../validation/profileSchemas.js";

export const profileRouter = Router();
profileRouter.use(authenticate, authorizeCandidate);
profileRouter.get("/", asyncHandler(getProfile));
profileRouter.put("/", validate(updateProfileSchema), asyncHandler(updateProfile));
profileRouter.post("/resume", resumeUpload.single("resume"), asyncHandler(uploadResume));
profileRouter.delete("/resume", asyncHandler(deleteResume));
profileRouter.get("/resume/download", asyncHandler(downloadResume));
profileRouter.post("/photo", avatarUpload.single("photo"), asyncHandler(uploadProfilePhoto));
profileRouter.delete("/photo", asyncHandler(deleteProfilePhoto));
