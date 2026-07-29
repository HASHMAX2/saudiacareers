import { Router } from "express";
import { getFilterOptions, getJob, getJobCompany, listJobs, reportJob } from "../controllers/jobController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeCandidate } from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { filterOptionsSchema, jobIdSchema, jobReportSchema, listJobsSchema } from "../validation/jobSchemas.js";

export const jobRouter = Router();
jobRouter.get("/filter-options", validate(filterOptionsSchema), asyncHandler(getFilterOptions));
jobRouter.get("/", validate(listJobsSchema), asyncHandler(listJobs));
jobRouter.get("/:id", validate(jobIdSchema), asyncHandler(getJob));
jobRouter.get("/:id/company", validate(jobIdSchema), asyncHandler(getJobCompany));
jobRouter.post("/:id/report", authenticate, authorizeCandidate, validate(jobReportSchema), asyncHandler(reportJob));
