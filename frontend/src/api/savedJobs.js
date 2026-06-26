import { api } from "./client.js";

export const savedJobsApi = {
  getAll: () => api.get("/saved-jobs"),
  getIds: () => api.get("/saved-jobs/ids"),
  save: (jobId) => api.post("/saved-jobs", { jobId }),
  unsave: (jobId) => api.delete(`/saved-jobs/${jobId}`),
};
