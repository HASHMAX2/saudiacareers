import { api } from "./client.js";

export const jobsApi = {
  list: (params) => api.get("/jobs", { params }),
  get: (id) => api.get(`/jobs/${id}`),
  getCompany: (id) => api.get(`/jobs/${id}/company`),
  filterOptions: () => api.get("/jobs/filter-options"),
  report: (id, data) => api.post(`/jobs/${id}/report`, data),
};

