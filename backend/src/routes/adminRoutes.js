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
import {
  approveVerification,
  listInvoicesAdmin,
  listPendingVerifications,
  markInvoicePaid,
  markInvoiceRefunded,
  rejectVerification,
} from "../controllers/adminEmployerBillingController.js";
import { parseImport } from "../controllers/importController.js";
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
  adminInvoicesQuerySchema,
  adminJobsQuerySchema,
  applicationStatusSchema,
  createJobSchema,
  invoiceIdSchema,
  jobStatusSchema,
  pendingVerificationsQuerySchema,
  rejectVerificationSchema,
  updateJobSchema,
  verificationDecisionSchema,
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
adminRouter.post("/import/parse", asyncHandler(parseImport));

adminRouter.get(
  "/employer-verifications",
  validate(pendingVerificationsQuerySchema),
  asyncHandler(listPendingVerifications),
);
adminRouter.patch(
  "/employer-verifications/:id/approve",
  validate(verificationDecisionSchema),
  asyncHandler(approveVerification),
);
adminRouter.patch(
  "/employer-verifications/:id/reject",
  validate(rejectVerificationSchema),
  asyncHandler(rejectVerification),
);

adminRouter.get("/invoices", validate(adminInvoicesQuerySchema), asyncHandler(listInvoicesAdmin));
adminRouter.patch("/invoices/:id/mark-paid", validate(invoiceIdSchema), asyncHandler(markInvoicePaid));
adminRouter.patch("/invoices/:id/mark-refunded", validate(invoiceIdSchema), asyncHandler(markInvoiceRefunded));
