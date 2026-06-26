import { Router } from "express";
import { getSavedIds, getSavedJobs, saveJob, unsaveJob } from "../controllers/savedJobsController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeCandidate } from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { savedJobIdSchema, saveJobSchema } from "../validation/savedJobSchemas.js";

export const savedJobsRouter = Router();
savedJobsRouter.use(authenticate, authorizeCandidate);
savedJobsRouter.get("/", asyncHandler(getSavedJobs));
savedJobsRouter.get("/ids", asyncHandler(getSavedIds));
savedJobsRouter.post("/", validate(saveJobSchema), asyncHandler(saveJob));
savedJobsRouter.delete("/:jobId", validate(savedJobIdSchema), asyncHandler(unsaveJob));
