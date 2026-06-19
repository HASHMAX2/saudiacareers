import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let refreshPromise = null;

function refreshSession() {
  refreshPromise ??= refreshClient
    .post("/auth/refresh-token")
    .then(({ data }) => {
      useAuthStore.getState().setSession(data.data);
      return data.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshRequest = originalRequest?.url === "/auth/refresh-token";

    if (!isUnauthorized || originalRequest?._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshSession();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/admin/login")) {
        window.location.assign(window.location.pathname.startsWith("/admin/") ? "/admin/login" : "/login");
      }
      return Promise.reject(refreshError);
    }
  },
);

export async function restoreSession() {
  try {
    await refreshSession();
  } catch {
    useAuthStore.getState().clearSession();
  }
}
