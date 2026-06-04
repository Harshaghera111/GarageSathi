/**
 * ProtectedRoute — GarageSathi
 *
 * Route guard that redirects unauthenticated users to login.
 * Shows loading spinner during initial auth check.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Loader from '@/components/common/Loader';

export default function ProtectedRoute() {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return <Loader fullPage text="Loading..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render child routes
  return <Outlet />;
}
