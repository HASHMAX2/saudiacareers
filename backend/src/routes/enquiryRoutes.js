import { Router } from "express";
import { submitEnquiry } from "../controllers/enquiryController.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { enquirySchema } from "../validation/employerSchemas.js";

export const enquiryRouter = Router();
enquiryRouter.post("/", authRateLimiter, validate(enquirySchema), asyncHandler(submitEnquiry));
