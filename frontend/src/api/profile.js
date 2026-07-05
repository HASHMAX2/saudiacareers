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

  employment: {
    add: (data) => api.post("/profile/employment", data),
    update: (id, data) => api.put(`/profile/employment/${id}`, data),
    remove: (id) => api.delete(`/profile/employment/${id}`),
  },

  education: {
    add: (data) => api.post("/profile/education", data),
    update: (id, data) => api.put(`/profile/education/${id}`, data),
    remove: (id) => api.delete(`/profile/education/${id}`),
  },

  certifications: {
    add: (data) => api.post("/profile/certifications", data),
    update: (id, data) => api.put(`/profile/certifications/${id}`, data),
    remove: (id) => api.delete(`/profile/certifications/${id}`),
  },
};
