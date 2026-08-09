import { api } from "./client.js";

export const companiesApi = {
  get: (type, id) => api.get(`/companies/${type}/${id}`),
};
