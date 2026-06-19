import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/common/Spinner.jsx";

export function AdminRoute() {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const location = useLocation();

  if (!isInitialized) return <Spinner label="Restoring session" />;
  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/admin/login" />;
  }
  if (user.role !== "ADMIN") return <Navigate replace to="/unauthorized" />;
  if (user.mustChangePassword && location.pathname !== "/admin/change-password") {
    return <Navigate replace to="/admin/change-password" />;
  }
  return <Outlet />;
}

