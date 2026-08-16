import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { Loader2 } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (redirectIfAuthenticated && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!redirectIfAuthenticated && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
