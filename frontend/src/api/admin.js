import { api } from "./client.js";

const JOB_FIELDS = ["title", "companyName", "location", "industry", "employmentType", "experienceRequired", "salaryRange", "description", "requiredSkills", "hrEmail", "applicationDeadline", "status"];

function pickJobFields(payload) {
  return Object.fromEntries(JOB_FIELDS.filter((k) => k in payload).map((k) => [k, payload[k]]));
}

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  jobs: (params) => api.get("/admin/jobs", { params }),
  job: (id) => api.get(`/admin/jobs/${id}`),
  createJob: (payload) => api.post("/admin/jobs", pickJobFields(payload)),
  updateJob: (id, payload) => api.put(`/admin/jobs/${id}`, pickJobFields(payload)),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  updateJobStatus: (id, status) => api.patch(`/admin/jobs/${id}/status`, { status }),
  applications: (params) => api.get("/admin/applications", { params }),
  application: (id) => api.get(`/admin/applications/${id}`),
  updateApplicationStatus: (id, status) =>
    api.patch(`/admin/applications/${id}/status`, { status }),
  exportApplications: (params = {}) =>
    api.get("/admin/applications/export", { params, responseType: "blob" }),
  parseImport: (text) => api.post("/admin/import/parse", { text }),
};
