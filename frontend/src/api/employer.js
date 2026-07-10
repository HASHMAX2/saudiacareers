import { api } from "./client.js";

export const employerApi = {
  register:              (data)         => api.post("/auth/employer/register", data),
  getProfile:            ()             => api.get("/employer/profile"),
  updateProfile:         (data)         => api.put("/employer/profile", data),
  getDashboard:          ()             => api.get("/employer/dashboard"),
  listJobs:              (params)       => api.get("/employer/jobs", { params }),
  listPendingJobs:       ()             => api.get("/employer/jobs/pending"),
  getJob:                (id)           => api.get(`/employer/jobs/${id}`),
  createJob:             (data)         => api.post("/employer/jobs", data),
  updateJob:             (id, data)     => api.put(`/employer/jobs/${id}`, data),
  updateJobStatus:       (id, data)     => api.patch(`/employer/jobs/${id}/status`, data),
  deleteJob:             (id)           => api.delete(`/employer/jobs/${id}`),
  reviseJob:             (id)           => api.post(`/employer/jobs/${id}/revise`),
  getJobApplications:    (jobId, params) => api.get(`/employer/jobs/${jobId}/applications`, { params }),
  getAllApplications:    (params)       => api.get("/employer/applications", { params }),
  getApplication:        (id)           => api.get(`/employer/applications/${id}`),
  updateAppStatus:       (id, data)     => api.patch(`/employer/applications/${id}/status`, data),

  getVerification:       ()             => api.get("/employer/verification"),
  uploadVerificationDoc: (documentType, file) => {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("document", file);
    return api.post("/employer/verification/documents", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  deleteVerificationDoc: (id)           => api.delete(`/employer/verification/documents/${id}`),
  submitVerification:    ()             => api.post("/employer/verification/submit"),
  submitSupportRequest:  (data)         => api.post("/employer/support", data),

  getSubscription:       ()             => api.get("/employer/subscription"),
  listInvoices:          (params)       => api.get("/employer/invoices", { params }),
  requestCreditPurchase: (credits)      => api.post("/employer/invoices/credit-purchase", { credits }),
  requestPlanChange:     (planTier)     => api.post("/employer/invoices/plan-change", { planTier }),
  requestRefund:         (invoiceId, reason) => api.post(`/employer/invoices/${invoiceId}/refund-request`, { reason }),
  cancelSubscription:    ()             => api.post("/employer/subscription/cancel"),
  resumeSubscription:    ()             => api.post("/employer/subscription/resume"),
  downloadInvoicePdf:    (id)           => api.get(`/employer/invoices/${id}/pdf`, { responseType: "blob" }),
};

export const enquiryApi = {
  submit: (data) => api.post("/enquiries", data),
};
