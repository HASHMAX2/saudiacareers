import { Router } from "express";
import {
  createEmployerJob,
  createJobRevision,
  deleteEmployerJob,
  deleteVerificationDocument,
  getApplicationDetail,
  getEmployerDashboard,
  getEmployerJob,
  getEmployerProfile,
  getVerification,
  listAllApplications,
  listEmployerJobs,
  listEmployerPendingJobs,
  listJobApplications,
  submitEmployerSupportRequest,
  submitVerification,
  updateApplicationStatus,
  updateEmployerJob,
  updateEmployerJobStatus,
  updateEmployerProfile,
  uploadVerificationDocument,
} from "../controllers/employerController.js";
import { verificationDocUpload } from "../middleware/upload.js";
import {
  cancelSubscription,
  downloadInvoicePdf,
  getSubscription,
  listInvoices,
  requestCreditPurchase,
  requestPlanChange,
  requestRefund,
  resumeSubscription,
} from "../controllers/employerBillingController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeEmployer } from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createJobSchema, adminIdSchema, jobStatusSchema, updateJobSchema } from "../validation/adminSchemas.js";
import {
  employerAllApplicationsQuerySchema,
  employerApplicationStatusSchema,
  employerJobApplicationsQuerySchema,
  employerJobQuerySchema,
  employerProfileSchema,
  employerSupportRequestSchema,
  verificationDocumentUploadSchema,
} from "../validation/employerSchemas.js";
import {
  creditPurchaseSchema,
  invoiceIdParamSchema,
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
employerRouter.get("/jobs/pending", asyncHandler(listEmployerPendingJobs));
employerRouter.get("/jobs/:id", validate(adminIdSchema), asyncHandler(getEmployerJob));
employerRouter.put("/jobs/:id", validate(updateJobSchema), asyncHandler(updateEmployerJob));
employerRouter.patch("/jobs/:id/status", validate(jobStatusSchema), asyncHandler(updateEmployerJobStatus));
employerRouter.delete("/jobs/:id", validate(adminIdSchema), asyncHandler(deleteEmployerJob));
employerRouter.post("/jobs/:id/revise", validate(adminIdSchema), asyncHandler(createJobRevision));
employerRouter.get(
  "/jobs/:jobId/applications",
  validate(employerJobApplicationsQuerySchema),
  asyncHandler(listJobApplications),
);

employerRouter.get("/applications", validate(employerAllApplicationsQuerySchema), asyncHandler(listAllApplications));
employerRouter.get("/applications/:id", validate(adminIdSchema), asyncHandler(getApplicationDetail));
employerRouter.patch(
  "/applications/:id/status",
  validate(employerApplicationStatusSchema),
  asyncHandler(updateApplicationStatus),
);

employerRouter.get("/verification", asyncHandler(getVerification));
employerRouter.post(
  "/verification/documents",
  verificationDocUpload.single("document"),
  validate(verificationDocumentUploadSchema),
  asyncHandler(uploadVerificationDocument),
);
employerRouter.delete("/verification/documents/:id", validate(adminIdSchema), asyncHandler(deleteVerificationDocument));
employerRouter.post("/verification/submit", asyncHandler(submitVerification));

employerRouter.post("/support", validate(employerSupportRequestSchema), asyncHandler(submitEmployerSupportRequest));

employerRouter.get("/subscription", asyncHandler(getSubscription));
employerRouter.get("/invoices", validate(invoicesQuerySchema), asyncHandler(listInvoices));
employerRouter.get("/invoices/:id/pdf", validate(invoiceIdParamSchema), asyncHandler(downloadInvoicePdf));
employerRouter.post("/invoices/credit-purchase", validate(creditPurchaseSchema), asyncHandler(requestCreditPurchase));
employerRouter.post("/invoices/plan-change", validate(planChangeSchema), asyncHandler(requestPlanChange));
employerRouter.post("/invoices/:id/refund-request", validate(refundRequestSchema), asyncHandler(requestRefund));
employerRouter.post("/subscription/cancel", asyncHandler(cancelSubscription));
employerRouter.post("/subscription/resume", asyncHandler(resumeSubscription));
