import { Router } from "express";
import {
  deleteResume,
  deleteProfilePhoto,
  downloadResume,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  uploadResume,
  addEmploymentEntry,
  updateEmploymentEntry,
  deleteEmploymentEntry,
  addEducationEntry,
  updateEducationEntry,
  deleteEducationEntry,
  addCertification,
  updateCertification,
  deleteCertification,
} from "../controllers/profileController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeCandidate } from "../middleware/authorizeAdmin.js";
import { avatarUpload, resumeUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  updateProfileSchema,
  addEmploymentSchema,
  updateEmploymentSchema,
  addEducationSchema,
  updateEducationSchema,
  addCertificationSchema,
  updateCertificationSchema,
} from "../validation/profileSchemas.js";

export const profileRouter = Router();
profileRouter.use(authenticate, authorizeCandidate);

// Base profile
profileRouter.get("/", asyncHandler(getProfile));
profileRouter.put("/", validate(updateProfileSchema), asyncHandler(updateProfile));
profileRouter.post("/resume", resumeUpload.single("resume"), asyncHandler(uploadResume));
profileRouter.delete("/resume", asyncHandler(deleteResume));
profileRouter.get("/resume/download", asyncHandler(downloadResume));
profileRouter.post("/photo", avatarUpload.single("photo"), asyncHandler(uploadProfilePhoto));
profileRouter.delete("/photo", asyncHandler(deleteProfilePhoto));

// Employment entries
profileRouter.post("/employment", validate(addEmploymentSchema), asyncHandler(addEmploymentEntry));
profileRouter.put("/employment/:id", validate(updateEmploymentSchema), asyncHandler(updateEmploymentEntry));
profileRouter.delete("/employment/:id", asyncHandler(deleteEmploymentEntry));

// Education entries
profileRouter.post("/education", validate(addEducationSchema), asyncHandler(addEducationEntry));
profileRouter.put("/education/:id", validate(updateEducationSchema), asyncHandler(updateEducationEntry));
profileRouter.delete("/education/:id", asyncHandler(deleteEducationEntry));

// Certifications
profileRouter.post("/certifications", validate(addCertificationSchema), asyncHandler(addCertification));
profileRouter.put("/certifications/:id", validate(updateCertificationSchema), asyncHandler(updateCertification));
profileRouter.delete("/certifications/:id", asyncHandler(deleteCertification));
