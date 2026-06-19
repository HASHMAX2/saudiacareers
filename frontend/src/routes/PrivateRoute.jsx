import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/common/Spinner.jsx";

export function PrivateRoute() {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const location = useLocation();

  if (!isInitialized) return <Spinner label="Restoring session" />;
  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  if (user.role !== "CANDIDATE") return <Navigate replace to="/unauthorized" />;
  return <Outlet />;
}

