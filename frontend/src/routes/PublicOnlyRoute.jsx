import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/common/Spinner.jsx";

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) return <Spinner label="Restoring session" />;
  if (isAuthenticated) {
    const target = user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
    return <Navigate replace to={target} />;
  }
  return <Outlet />;
}

