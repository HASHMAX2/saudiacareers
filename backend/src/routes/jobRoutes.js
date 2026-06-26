import { Router } from "express";
import { getFilterOptions, getJob, listJobs } from "../controllers/jobController.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { filterOptionsSchema, jobIdSchema, listJobsSchema } from "../validation/jobSchemas.js";

export const jobRouter = Router();
jobRouter.get("/filter-options", validate(filterOptionsSchema), asyncHandler(getFilterOptions));
jobRouter.get("/", validate(listJobsSchema), asyncHandler(listJobs));
jobRouter.get("/:id", validate(jobIdSchema), asyncHandler(getJob));
