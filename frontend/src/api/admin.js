import { api } from "./client.js";

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  jobs: (params) => api.get("/admin/jobs", { params }),
  job: (id) => api.get(`/admin/jobs/${id}`),
  createJob: (payload) => api.post("/admin/jobs", payload),
  updateJob: (id, payload) => api.put(`/admin/jobs/${id}`, payload),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  updateJobStatus: (id, status) => api.patch(`/admin/jobs/${id}/status`, { status }),
  applications: (params) => api.get("/admin/applications", { params }),
  application: (id) => api.get(`/admin/applications/${id}`),
  updateApplicationStatus: (id, status) =>
    api.patch(`/admin/applications/${id}/status`, { status }),
  exportApplications: (params = {}) =>
    api.get("/admin/applications/export", { params, responseType: "blob" }),
};
