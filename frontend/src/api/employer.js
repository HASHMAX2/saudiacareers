import { api } from "./client.js";

export const employerApi = {
  register:              (data)         => api.post("/auth/employer/register", data),
  getProfile:            ()             => api.get("/employer/profile"),
  updateProfile:         (data)         => api.put("/employer/profile", data),
  getDashboard:          ()             => api.get("/employer/dashboard"),
  listJobs:              (params)       => api.get("/employer/jobs", { params }),
  createJob:             (data)         => api.post("/employer/jobs", data),
  updateJob:             (id, data)     => api.put(`/employer/jobs/${id}`, data),
  updateJobStatus:       (id, data)     => api.patch(`/employer/jobs/${id}/status`, data),
  deleteJob:             (id)           => api.delete(`/employer/jobs/${id}`),
  getJobApplications:    (jobId, params) => api.get(`/employer/jobs/${jobId}/applications`, { params }),
  getApplication:        (id)           => api.get(`/employer/applications/${id}`),
  updateAppStatus:       (id, data)     => api.patch(`/employer/applications/${id}/status`, data),
};

export const enquiryApi = {
  submit: (data) => api.post("/enquiries", data),
};
