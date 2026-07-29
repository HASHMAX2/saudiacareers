import { api } from "./client.js";

const JOB_FIELDS = ["title", "companyName", "location", "industry", "employmentType", "experienceRequired", "salaryRange", "description", "requiredSkills", "hrEmail", "gender", "nationality", "applicationDeadline", "status", "department", "workMode", "applyMethod", "applyContact", "screeningQuestion", "listingDurationDays"];

function pickJobFields(payload) {
  return Object.fromEntries(JOB_FIELDS.filter((k) => k in payload).map((k) => [k, payload[k]]));
}

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  jobs: (params) => api.get("/admin/jobs", { params }),
  job: (id) => api.get(`/admin/jobs/${id}`),
  createJob: (payload) => api.post("/admin/jobs", pickJobFields(payload)),
  updateJob: (id, payload) => api.put(`/admin/jobs/${id}`, pickJobFields(payload)),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  updateJobStatus: (id, status) => api.patch(`/admin/jobs/${id}/status`, { status }),
  approveJobReview: (id, note) => api.patch(`/admin/jobs/${id}/approve`, { note }),
  rejectJobReview: (id, note) => api.patch(`/admin/jobs/${id}/reject`, { note }),
  applications: (params) => api.get("/admin/applications", { params }),
  application: (id) => api.get(`/admin/applications/${id}`),
  updateApplicationStatus: (id, status) =>
    api.patch(`/admin/applications/${id}/status`, { status }),
  exportApplications: (params = {}) =>
    api.get("/admin/applications/export", { params, responseType: "blob" }),
  parseImport: (text, signal) => api.post("/admin/import/parse", { text }, { signal }),
  parseImportExcel: (file, signal) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/admin/import/parse-excel", form, { headers: { "Content-Type": "multipart/form-data" }, signal });
  },

  pendingVerifications: (params) => api.get("/admin/employer-verifications", { params }),
  verificationDetail: (id) => api.get(`/admin/employer-verifications/${id}`),
  approveVerification: (id, note) => api.patch(`/admin/employer-verifications/${id}/approve`, { note }),
  requestMoreInfo: (id, note) => api.patch(`/admin/employer-verifications/${id}/request-info`, { note }),
  rejectVerification: (id, note) => api.patch(`/admin/employer-verifications/${id}/reject`, { note }),

  billingOverview: (params) => api.get("/admin/billing-overview", { params }),
  invoices: (params) => api.get("/admin/invoices", { params }),
  approveRefund: (id) => api.patch(`/admin/invoices/${id}/approve-refund`),
  rejectInvoiceRefund: (id, reason) => api.patch(`/admin/invoices/${id}/reject-refund`, { reason }),

  employers: (params) => api.get("/admin/employers", { params }),
  suspendEmployer: (id, reason) => api.patch(`/admin/employers/${id}/suspend`, { reason }),
  unsuspendEmployer: (id) => api.patch(`/admin/employers/${id}/unsuspend`),

  flaggedJobs: () => api.get("/admin/jobs-flagged"),
  dismissJobReports: (id) => api.patch(`/admin/jobs/${id}/dismiss-reports`),

  scrapedJobs: (params) => api.get("/admin/scraped-jobs", { params }),
  createScrapedJob: (payload) => api.post("/admin/scraped-jobs", payload),
  recrawlScrapedJob: (id) => api.patch(`/admin/scraped-jobs/${id}/recrawl`),
  markScrapedJobReviewed: (id) => api.patch(`/admin/scraped-jobs/${id}/mark-reviewed`),

  plans: () => api.get("/admin/plans"),
  updatePlan: (id, payload) => api.patch(`/admin/plans/${id}`, payload),

  candidates: (params) => api.get("/admin/candidates", { params }),
  candidate: (id) => api.get(`/admin/candidates/${id}`),
  sendCandidateFeedback: (id, comments) => api.post(`/admin/candidates/${id}/feedback`, { comments }),
  calculateCandidateAIScore: (id) => api.post(`/admin/candidates/${id}/ai-score`),
};
