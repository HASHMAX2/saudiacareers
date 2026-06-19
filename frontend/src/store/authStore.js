import { create } from "zustand";

const initialState = {
  user: null,
  accessToken: null,
  isInitialized: false,
};

export const useAuthStore = create((set) => ({
  ...initialState,
  setSession: ({ user, accessToken }) =>
    set({ user, accessToken, isInitialized: true }),
  clearSession: () =>
    set({ user: null, accessToken: null, isInitialized: true }),
  setInitialized: () => set({ isInitialized: true }),
}));

