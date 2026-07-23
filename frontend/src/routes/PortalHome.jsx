import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/common/Spinner.jsx";

const Landing = lazy(() => import("../pages/public/Landing.jsx").then((m) => ({ default: m.Landing })));

const ADMIN_HOSTS = ["admin.saudiacareers.com", "saudiacareers-admin.vercel.app"];
const EMPLOYER_HOSTS = ["employer.saudiacareers.com", "saudiacareers-employer.vercel.app"];

function portalForHost(hostname) {
  if (ADMIN_HOSTS.includes(hostname) || hostname.startsWith("saudiacareers-admin-")) return "ADMIN";
  if (EMPLOYER_HOSTS.includes(hostname) || hostname.startsWith("saudiacareers-employer-")) return "EMPLOYER";
  return null;
}

export function PortalHome() {
  const { isAuthenticated, user } = useAuth();
  const portal = portalForHost(window.location.hostname);

  if (portal === "ADMIN") {
    return <Navigate replace to={isAuthenticated && user.role === "ADMIN" ? "/admin/dashboard" : "/admin/login"} />;
  }
  if (portal === "EMPLOYER") {
    return <Navigate replace to={isAuthenticated && user.role === "EMPLOYER" ? "/employer/dashboard" : "/employer/login"} />;
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner label="Loading…" /></div>}>
      <Landing />
    </Suspense>
  );
}
