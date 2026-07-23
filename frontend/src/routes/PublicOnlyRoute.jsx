import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { useAuth } from "../hooks/useAuth.js";
import { useAuthStore } from "../store/authStore.js";
import { Button } from "../components/common/Button.jsx";
import { Spinner } from "../components/common/Spinner.jsx";

const PORTAL_LABELS = {
  ADMIN: "Administrator",
  EMPLOYER: "Employer",
  CANDIDATE: "Candidate",
};

const DASHBOARD_PATHS = {
  ADMIN: "/admin/dashboard",
  EMPLOYER: "/employer/dashboard",
  CANDIDATE: "/dashboard",
};

function portalForPath(pathname) {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/employer")) return "EMPLOYER";
  return "CANDIDATE";
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isInitialized) return <Spinner label="Restoring session" />;

  if (isAuthenticated) {
    const targetPortal = portalForPath(location.pathname);
    if (user.role === targetPortal) {
      return <Navigate replace to={DASHBOARD_PATHS[user.role]} />;
    }

    async function handleLogout() {
      setLoggingOut(true);
      try {
        await authApi.logout();
      } catch {
        // clear local session regardless of API error
      }
      clearSession();
    }

    return (
      <div
        className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl p-10 text-center"
        style={{ border: "1px solid var(--border-default)", background: "var(--bg-white)" }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          You&apos;re signed in as {PORTAL_LABELS[user.role]}
        </h1>
        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Log out to sign in to the {PORTAL_LABELS[targetPortal]} portal instead, or continue to your
          current dashboard.
        </p>
        <div className="flex w-full gap-3">
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => navigate(DASHBOARD_PATHS[user.role])}
          >
            Go to my dashboard
          </Button>
          <Button className="w-full" disabled={loggingOut} onClick={handleLogout}>
            {loggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
