import { api } from "./client.js";

export const candidateApi = {
  dashboard: () => api.get("/candidate/dashboard"),
  careerTips: () => api.get("/candidate/career-tips"),
};
