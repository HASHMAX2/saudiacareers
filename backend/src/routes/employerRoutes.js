import { Router } from "express";
import {
  createEmployerJob,
  createJobRevision,
  deleteEmployerJob,
  deleteEmployerLogo,
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
  uploadEmployerLogo,
  uploadVerificationDocument,
} from "../controllers/employerController.js";
import { avatarUpload, verificationDocUpload } from "../middleware/upload.js";
import {
  cancelSubscription,
  changePlan,
  downloadAllInvoicesZip,
  downloadInvoicePdf,
  getBillingSummary,
  listInvoices,
  listTransactions,
  payInvoiceNow,
  previewPlanChange,
  purchaseCredits,
  requestRefund,
  resumeSubscription,
  updateBillingProfile,
  updatePaymentMethod,
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
  billingProfileSchema,
  creditPurchaseSchema,
  invoiceIdParamSchema,
  invoicesQuerySchema,
  planChangeSchema,
  refundRequestSchema,
  transactionsQuerySchema,
} from "../validation/employerBillingSchemas.js";

export const employerRouter = Router();
employerRouter.use(authenticate, authorizeEmployer);

employerRouter.get("/profile", asyncHandler(getEmployerProfile));
employerRouter.put("/profile", validate(employerProfileSchema), asyncHandler(updateEmployerProfile));
employerRouter.post("/logo", avatarUpload.single("logo"), asyncHandler(uploadEmployerLogo));
employerRouter.delete("/logo", asyncHandler(deleteEmployerLogo));

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

employerRouter.get("/billing/summary", asyncHandler(getBillingSummary));
employerRouter.put("/billing/profile", validate(billingProfileSchema), asyncHandler(updateBillingProfile));
employerRouter.get("/billing/invoices", validate(invoicesQuerySchema), asyncHandler(listInvoices));
employerRouter.get("/billing/invoices/download-all", asyncHandler(downloadAllInvoicesZip));
employerRouter.get("/billing/invoices/:id/pdf", validate(invoiceIdParamSchema), asyncHandler(downloadInvoicePdf));
employerRouter.post("/billing/invoices/:id/pay", validate(invoiceIdParamSchema), asyncHandler(payInvoiceNow));
employerRouter.post("/billing/invoices/:id/refund-request", validate(refundRequestSchema), asyncHandler(requestRefund));
employerRouter.get("/billing/transactions", validate(transactionsQuerySchema), asyncHandler(listTransactions));
employerRouter.post("/billing/credits/purchase", validate(creditPurchaseSchema), asyncHandler(purchaseCredits));
employerRouter.post("/billing/plan/preview", validate(planChangeSchema), asyncHandler(previewPlanChange));
employerRouter.post("/billing/plan/change", validate(planChangeSchema), asyncHandler(changePlan));
employerRouter.post("/billing/payment-method", asyncHandler(updatePaymentMethod));
employerRouter.post("/billing/subscription/cancel", asyncHandler(cancelSubscription));
employerRouter.post("/billing/subscription/resume", asyncHandler(resumeSubscription));
