import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { Loader2 } from "lucide-react";
import "./ProtectedRoute.css";

/**
 * ProtectedRoute
 *
 * Wraps a route requiring authentication.
 * - While auth state is loading: shows a centered spinner (no flicker).
 * - If unauthenticated: redirects to /login.
 * - If authenticated: renders children.
 */
export const ProtectedRoute = ({
  children,
  redirectIfAuthenticated = false,
}) => {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="protected-route-loader-container">
        <Loader2 size={32} className="protected-route-spinner" />
      </div>
    );
  }

  if (redirectIfAuthenticated && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!redirectIfAuthenticated && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
