import { create } from "zustand";

export const useJobStore = create((set) => ({
  jobs: [],
  filters: {},
  setJobs: (jobs) => set({ jobs }),
  setFilters: (filters) => set({ filters }),
  reset: () => set({ jobs: [], filters: {} }),
}));

