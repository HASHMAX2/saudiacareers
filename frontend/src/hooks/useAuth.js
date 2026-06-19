import { useAuthStore } from "../store/authStore.js";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  return {
    user,
    accessToken,
    isInitialized,
    isAuthenticated: Boolean(user && accessToken),
    isAdmin: user?.role === "ADMIN",
  };
}

