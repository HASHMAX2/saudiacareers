import { api } from "./client.js";

export const jobsApi = {
  list: (params) => api.get("/jobs", { params }),
  get: (id) => api.get(`/jobs/${id}`),
  filterOptions: () => api.get("/jobs/filter-options"),
};

