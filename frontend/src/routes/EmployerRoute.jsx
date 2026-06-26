import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/common/Spinner.jsx";

export function EmployerRoute() {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const location = useLocation();

  if (!isInitialized) return <Spinner label="Restoring session" />;
  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/employer/login" />;
  }
  if (user.role !== "EMPLOYER") return <Navigate replace to="/unauthorized" />;
  return <Outlet />;
}
