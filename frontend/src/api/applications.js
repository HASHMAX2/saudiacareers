import { api } from "./client.js";

export const applicationsApi = {
  apply: (jobId) => api.post("/applications", { jobId }),
  mine: () => api.get("/applications/mine"),
};

