/**
 * ProtectedRoute — wraps routes that require authentication.
 * Redirects unauthenticated users to /login.
 * Optionally enforces a minimum role (e.g. "Admin" for the admin panel).
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  /** If provided, the user must have this role or they are redirected to / */
  requiredRole?: 'Admin' | 'User';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  // Not logged in — send to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role (e.g. non-admin trying to reach /admin)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render the child route
  return <Outlet />;
}
