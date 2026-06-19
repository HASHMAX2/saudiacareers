import { api } from "./client.js";

export const profileApi = {
  get: () => api.get("/profile"),
  update: (payload) => api.put("/profile", payload),
  uploadResume: (file) => {
    const data = new FormData();
    data.append("resume", file);
    return api.post("/profile/resume", data);
  },
  deleteResume: () => api.delete("/profile/resume"),
  downloadResume: () => api.get("/profile/resume/download"),
  uploadPhoto: (file) => {
    const data = new FormData();
    data.append("photo", file);
    return api.post("/profile/photo", data);
  },
  deletePhoto: () => api.delete("/profile/photo"),
};
