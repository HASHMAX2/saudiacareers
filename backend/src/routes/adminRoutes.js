import { Router } from "express";
import {
  createJob,
  dashboard,
  deleteJob,
  exportApplications,
  getAdminJob,
  getApplication,
  listAdminJobs,
  listApplications,
  updateApplicationStatus,
  updateJob,
  updateJobStatus,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  authorizeAdmin,
  requirePasswordChangeComplete,
} from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  adminApplicationsQuerySchema,
  adminIdSchema,
  adminJobsQuerySchema,
  applicationStatusSchema,
  createJobSchema,
  jobStatusSchema,
  updateJobSchema,
} from "../validation/adminSchemas.js";

export const adminRouter = Router();
adminRouter.use(authenticate, authorizeAdmin, requirePasswordChangeComplete);
adminRouter.get("/dashboard", asyncHandler(dashboard));
adminRouter.get("/jobs", validate(adminJobsQuerySchema), asyncHandler(listAdminJobs));
adminRouter.post("/jobs", validate(createJobSchema), asyncHandler(createJob));
adminRouter.get("/jobs/:id", validate(adminIdSchema), asyncHandler(getAdminJob));
adminRouter.put("/jobs/:id", validate(updateJobSchema), asyncHandler(updateJob));
adminRouter.delete("/jobs/:id", validate(adminIdSchema), asyncHandler(deleteJob));
adminRouter.patch("/jobs/:id/status", validate(jobStatusSchema), asyncHandler(updateJobStatus));
adminRouter.get("/applications/export", validate(adminApplicationsQuerySchema), asyncHandler(exportApplications));
adminRouter.get("/applications", validate(adminApplicationsQuerySchema), asyncHandler(listApplications));
adminRouter.get("/applications/:id", validate(adminIdSchema), asyncHandler(getApplication));
adminRouter.patch("/applications/:id/status", validate(applicationStatusSchema), asyncHandler(updateApplicationStatus));
