import { Router } from "express";
import {
  approveJobReview,
  createJob,
  dashboard,
  deleteJob,
  dismissJobReports,
  exportApplications,
  getAdminJob,
  getApplication,
  listAdminJobs,
  listApplications,
  listFlaggedJobs,
  rejectJobReview,
  updateApplicationStatus,
  updateJob,
  updateJobStatus,
} from "../controllers/adminController.js";
import {
  approveRefund,
  approveVerification,
  getVerificationDetail,
  listBillingOverview,
  listInvoicesAdmin,
  listPendingVerifications,
  rejectInvoiceRefund,
  rejectVerification,
  requestMoreInfo,
} from "../controllers/adminEmployerBillingController.js";
import {
  listEmployers,
  suspendEmployer,
  unsuspendEmployer,
} from "../controllers/adminEmployersController.js";
import {
  calculateCandidateAIScore,
  getCandidate,
  listCandidates,
  sendCandidateFeedback,
} from "../controllers/adminCandidatesController.js";
import { parseImport } from "../controllers/importController.js";
import { listPlansAdmin, updatePlan } from "../controllers/adminPlansController.js";
import {
  createScrapedJob,
  listScrapedJobs,
  markDuplicateReviewed,
  recrawlScrapedJob,
} from "../controllers/scrapedJobController.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  authorizeAdmin,
  requirePasswordChangeComplete,
} from "../middleware/authorizeAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  adminApplicationsQuerySchema,
  adminCandidatesQuerySchema,
  adminEmployersQuerySchema,
  adminIdSchema,
  adminInvoicesQuerySchema,
  adminJobsQuerySchema,
  applicationStatusSchema,
  billingOverviewQuerySchema,
  candidateFeedbackSchema,
  createJobSchema,
  invoiceIdSchema,
  jobApprovalSchema,
  jobRejectionSchema,
  jobStatusSchema,
  pendingVerificationsQuerySchema,
  rejectRefundSchema,
  rejectVerificationSchema,
  suspendEmployerSchema,
  updateJobSchema,
  updatePlanSchema,
  verificationDecisionSchema,
} from "../validation/adminSchemas.js";
import {
  createScrapedJobSchema,
  scrapedJobIdSchema,
  scrapedJobsQuerySchema,
} from "../validation/scrapedJobSchemas.js";

export const adminRouter = Router();
adminRouter.use(authenticate, authorizeAdmin, requirePasswordChangeComplete);
adminRouter.get("/dashboard", asyncHandler(dashboard));
adminRouter.get("/jobs", validate(adminJobsQuerySchema), asyncHandler(listAdminJobs));
adminRouter.post("/jobs", validate(createJobSchema), asyncHandler(createJob));
adminRouter.get("/jobs/:id", validate(adminIdSchema), asyncHandler(getAdminJob));
adminRouter.put("/jobs/:id", validate(updateJobSchema), asyncHandler(updateJob));
adminRouter.delete("/jobs/:id", validate(adminIdSchema), asyncHandler(deleteJob));
adminRouter.patch("/jobs/:id/status", validate(jobStatusSchema), asyncHandler(updateJobStatus));
adminRouter.patch("/jobs/:id/approve", validate(jobApprovalSchema), asyncHandler(approveJobReview));
adminRouter.patch("/jobs/:id/reject", validate(jobRejectionSchema), asyncHandler(rejectJobReview));
adminRouter.get("/jobs-flagged", asyncHandler(listFlaggedJobs));
adminRouter.patch("/jobs/:id/dismiss-reports", validate(adminIdSchema), asyncHandler(dismissJobReports));
adminRouter.get("/applications/export", validate(adminApplicationsQuerySchema), asyncHandler(exportApplications));
adminRouter.get("/applications", validate(adminApplicationsQuerySchema), asyncHandler(listApplications));
adminRouter.get("/applications/:id", validate(adminIdSchema), asyncHandler(getApplication));
adminRouter.patch("/applications/:id/status", validate(applicationStatusSchema), asyncHandler(updateApplicationStatus));
adminRouter.post("/import/parse", asyncHandler(parseImport));

adminRouter.get("/candidates", validate(adminCandidatesQuerySchema), asyncHandler(listCandidates));
adminRouter.get("/candidates/:id", validate(adminIdSchema), asyncHandler(getCandidate));
adminRouter.post("/candidates/:id/feedback", validate(candidateFeedbackSchema), asyncHandler(sendCandidateFeedback));
adminRouter.post("/candidates/:id/ai-score", validate(adminIdSchema), asyncHandler(calculateCandidateAIScore));

adminRouter.get(
  "/employer-verifications",
  validate(pendingVerificationsQuerySchema),
  asyncHandler(listPendingVerifications),
);
adminRouter.get(
  "/employer-verifications/:id",
  validate(adminIdSchema),
  asyncHandler(getVerificationDetail),
);
adminRouter.patch(
  "/employer-verifications/:id/approve",
  validate(verificationDecisionSchema),
  asyncHandler(approveVerification),
);
adminRouter.patch(
  "/employer-verifications/:id/request-info",
  validate(rejectVerificationSchema),
  asyncHandler(requestMoreInfo),
);
adminRouter.patch(
  "/employer-verifications/:id/reject",
  validate(rejectVerificationSchema),
  asyncHandler(rejectVerification),
);

adminRouter.get("/billing-overview", validate(billingOverviewQuerySchema), asyncHandler(listBillingOverview));
adminRouter.get("/invoices", validate(adminInvoicesQuerySchema), asyncHandler(listInvoicesAdmin));
adminRouter.patch("/invoices/:id/approve-refund", validate(invoiceIdSchema), asyncHandler(approveRefund));
adminRouter.patch("/invoices/:id/reject-refund", validate(rejectRefundSchema), asyncHandler(rejectInvoiceRefund));

adminRouter.get("/employers", validate(adminEmployersQuerySchema), asyncHandler(listEmployers));
adminRouter.patch("/employers/:id/suspend", validate(suspendEmployerSchema), asyncHandler(suspendEmployer));
adminRouter.patch("/employers/:id/unsuspend", validate(adminIdSchema), asyncHandler(unsuspendEmployer));

adminRouter.get("/scraped-jobs", validate(scrapedJobsQuerySchema), asyncHandler(listScrapedJobs));
adminRouter.post("/scraped-jobs", validate(createScrapedJobSchema), asyncHandler(createScrapedJob));
adminRouter.patch("/scraped-jobs/:id/recrawl", validate(scrapedJobIdSchema), asyncHandler(recrawlScrapedJob));
adminRouter.patch("/scraped-jobs/:id/mark-reviewed", validate(scrapedJobIdSchema), asyncHandler(markDuplicateReviewed));

adminRouter.get("/plans", asyncHandler(listPlansAdmin));
adminRouter.patch("/plans/:id", validate(updatePlanSchema), asyncHandler(updatePlan));
