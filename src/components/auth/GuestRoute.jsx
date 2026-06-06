/**
 * GuestRoute — GarageSathi
 *
 * Route guard that redirects authenticated users to the app dashboard.
 * Shows loading spinner during initial auth check.
 * Used to protect login/register pages from being accessed by logged-in users.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Loader from '@/components/common/Loader';

export default function GuestRoute() {
  const { user, loading } = useAuthStore();

  // Show loading while checking auth state
  if (loading) {
    return <Loader fullPage text="Loading..." />;
  }

  // Redirect to dashboard if authenticated
  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Render child routes
  return <Outlet />;
}
