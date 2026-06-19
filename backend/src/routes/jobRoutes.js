import { Router } from "express";
import { getJob, listJobs } from "../controllers/jobController.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { jobIdSchema, listJobsSchema } from "../validation/jobSchemas.js";

export const jobRouter = Router();
jobRouter.get("/", validate(listJobsSchema), asyncHandler(listJobs));
jobRouter.get("/:id", validate(jobIdSchema), asyncHandler(getJob));

