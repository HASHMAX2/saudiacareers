import { create } from "zustand";
import { applicationsApi } from "../api/applications.js";

export const useAppliedJobsStore = create((set, get) => ({
  appliedIds: new Set(),
  initialized: false,

  fetchIds: async () => {
    if (get().initialized) return;
    try {
      const { data } = await applicationsApi.getIds();
      set({ appliedIds: new Set(data.data), initialized: true });
    } catch {
      // guest or network error — ignore silently
    }
  },

  isApplied: (jobId) => get().appliedIds.has(jobId),

  markApplied: (jobId) =>
    set((state) => ({ appliedIds: new Set([...state.appliedIds, jobId]) })),

  reset: () => set({ appliedIds: new Set(), initialized: false }),
}));
