import { api } from "./client.js";

export const billingApi = {
  getSummary:           ()                  => api.get("/employer/billing/summary"),
  listInvoices:         (params)            => api.get("/employer/billing/invoices", { params }),
  downloadInvoicePdf:   (id)                => api.get(`/employer/billing/invoices/${id}/pdf`, { responseType: "blob" }),
  downloadAllInvoices:  ()                  => api.get("/employer/billing/invoices/download-all", { responseType: "blob" }),
  payInvoiceNow:        (id)                => api.post(`/employer/billing/invoices/${id}/pay`),
  requestRefund:        (id, reason)        => api.post(`/employer/billing/invoices/${id}/refund-request`, { reason }),
  listTransactions:     (params)            => api.get("/employer/billing/transactions", { params }),
  purchaseCredits:      (credits)           => api.post("/employer/billing/credits/purchase", { credits }),
  previewPlanChange:    (planTier)          => api.post("/employer/billing/plan/preview", { planTier }),
  changePlan:           (planTier)          => api.post("/employer/billing/plan/change", { planTier }),
  updatePaymentMethod:  ()                  => api.post("/employer/billing/payment-method"),
  updateBillingProfile: (data)              => api.put("/employer/billing/profile", data),
  cancelSubscription:   ()                  => api.post("/employer/billing/subscription/cancel"),
  resumeSubscription:   ()                  => api.post("/employer/billing/subscription/resume"),
};
