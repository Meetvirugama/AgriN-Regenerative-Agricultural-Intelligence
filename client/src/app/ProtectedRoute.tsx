import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * If true, authenticated users are redirected away (e.g. login page).
   * Defaults to false (redirect unauthenticated users to login).
   */
  redirectIfAuthenticated?: boolean;
}

/**
 * ProtectedRoute
 *
 * Wraps a route requiring authentication.
 * - While auth state is loading: shows a centered spinner (no flicker).
 * - If unauthenticated: redirects to /login.
 * - If authenticated: renders children.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
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
