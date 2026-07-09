import { Router } from "express";
import {
  createEmployerJob,
  deleteEmployerJob,
  getApplicationDetail,
  getEmployerDashboard,
  getEmployerProfile,
  getVerification,
  listEmployerJobs,
  listJobApplications,
  submitVerificationDocument,
  updateApplicationStatus,
  updateEmployerJob,
  updateEmployerJobStatus,
  updateEmployerProfile,
} from "../controllers/employerController.js";
import { verificationDocUpload } from "../middleware/upload.js";
import {
  cancelSubscription,
  getSubscription,
  listInvoices,
  requestCreditPurchase,
  requestPlanChange,
  requestRefund,
} from "../controllers/employerBillingController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeEmployer } from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createJobSchema, adminIdSchema, jobStatusSchema, updateJobSchema } from "../validation/adminSchemas.js";
import {
  employerApplicationStatusSchema,
  employerJobApplicationsQuerySchema,
  employerJobQuerySchema,
  employerProfileSchema,
} from "../validation/employerSchemas.js";
import {
  creditPurchaseSchema,
  invoicesQuerySchema,
  planChangeSchema,
  refundRequestSchema,
} from "../validation/employerBillingSchemas.js";

export const employerRouter = Router();
employerRouter.use(authenticate, authorizeEmployer);

employerRouter.get("/profile", asyncHandler(getEmployerProfile));
employerRouter.put("/profile", validate(employerProfileSchema), asyncHandler(updateEmployerProfile));

employerRouter.get("/dashboard", asyncHandler(getEmployerDashboard));

employerRouter.get("/jobs", validate(employerJobQuerySchema), asyncHandler(listEmployerJobs));
employerRouter.post("/jobs", validate(createJobSchema), asyncHandler(createEmployerJob));
employerRouter.put("/jobs/:id", validate(updateJobSchema), asyncHandler(updateEmployerJob));
employerRouter.patch("/jobs/:id/status", validate(jobStatusSchema), asyncHandler(updateEmployerJobStatus));
employerRouter.delete("/jobs/:id", validate(adminIdSchema), asyncHandler(deleteEmployerJob));
employerRouter.get(
  "/jobs/:jobId/applications",
  validate(employerJobApplicationsQuerySchema),
  asyncHandler(listJobApplications),
);

employerRouter.get("/applications/:id", validate(adminIdSchema), asyncHandler(getApplicationDetail));
employerRouter.patch(
  "/applications/:id/status",
  validate(employerApplicationStatusSchema),
  asyncHandler(updateApplicationStatus),
);

employerRouter.get("/verification", asyncHandler(getVerification));
employerRouter.post(
  "/verification/document",
  verificationDocUpload.single("document"),
  asyncHandler(submitVerificationDocument),
);

employerRouter.get("/subscription", asyncHandler(getSubscription));
employerRouter.get("/invoices", validate(invoicesQuerySchema), asyncHandler(listInvoices));
employerRouter.post("/invoices/credit-purchase", validate(creditPurchaseSchema), asyncHandler(requestCreditPurchase));
employerRouter.post("/invoices/plan-change", validate(planChangeSchema), asyncHandler(requestPlanChange));
employerRouter.post("/invoices/:id/refund-request", validate(refundRequestSchema), asyncHandler(requestRefund));
employerRouter.post("/subscription/cancel", asyncHandler(cancelSubscription));
