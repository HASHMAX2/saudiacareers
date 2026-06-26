import { create } from "zustand";
import { savedJobsApi } from "../api/savedJobs.js";

export const useSavedJobsStore = create((set, get) => ({
  savedIds: new Set(),
  initialized: false,

  fetchIds: async () => {
    if (get().initialized) return;
    try {
      const { data } = await savedJobsApi.getIds();
      set({ savedIds: new Set(data.data), initialized: true });
    } catch {
      // guest or network error — ignore silently
    }
  },

  isSaved: (jobId) => get().savedIds.has(jobId),

  toggle: async (jobId) => {
    const wasSaved = get().savedIds.has(jobId);
    set((state) => {
      const next = new Set(state.savedIds);
      if (wasSaved) next.delete(jobId); else next.add(jobId);
      return { savedIds: next };
    });
    try {
      if (wasSaved) await savedJobsApi.unsave(jobId);
      else await savedJobsApi.save(jobId);
    } catch {
      // revert optimistic update on failure
      set((state) => {
        const next = new Set(state.savedIds);
        if (wasSaved) next.add(jobId); else next.delete(jobId);
        return { savedIds: next };
      });
    }
  },

  remove: (jobId) =>
    set((state) => {
      const next = new Set(state.savedIds);
      next.delete(jobId);
      return { savedIds: next };
    }),

  reset: () => set({ savedIds: new Set(), initialized: false }),
}));
