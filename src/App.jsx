/**
 * App Root — GarageSathi
 *
 * Main application component with routing.
 * Uses lazy loading for route-based code splitting.
 * Sets up auth state listener on mount.
 */

import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange, getUserProfile } from '@/services/authService';
import Loader from '@/components/common/Loader';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import GuestRoute from '@/components/auth/GuestRoute';
import AppLayout from '@/components/layout/AppLayout';

// ====================================
// Lazy-loaded Pages (code splitting)
// Reduces initial bundle for cheap Android phones
// ====================================

// Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// App Pages
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const CustomersPage = lazy(() => import('@/pages/app/CustomersPage'));
const CustomerFormPage = lazy(() => import('@/pages/app/CustomerFormPage'));
const CustomerDetailPage = lazy(() => import('@/pages/app/CustomerDetailPage'));
const ServicesPage = lazy(() => import('@/pages/app/ServicesPage'));
const ServiceFormPage = lazy(() => import('@/pages/app/ServiceFormPage'));
const ServiceDetailPage = lazy(() => import('@/pages/app/ServiceDetailPage'));
const BillingPage = lazy(() => import('@/pages/app/BillingPage'));
const InvoiceFormPage = lazy(() => import('@/pages/app/InvoiceFormPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/app/InvoiceDetailPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));

/**
 * Suspense fallback — shown while lazy components load
 */
function PageLoader() {
  return <Loader fullPage text="Loading..." />;
}

export default function App() {
  const { setUser, clearUser, setLoading } = useAuthStore();

  /**
   * Subscribe to Firebase auth state changes.
   * When user logs in/out, fetch their profile and update Zustand store.
   */
  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
          } else {
            // User exists in Auth but not in Firestore — edge case
            console.warn('User profile not found in Firestore');
            clearUser();
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          clearUser();
        }
      } else {
        clearUser();
      }
    });

    return () => unsubscribe();
  // Zustand store functions (setUser, clearUser, setLoading) are stable references — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      {/* Toast notifications — positioned at top for mobile visibility */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />

      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ====================================
                Guest Routes
                ==================================== */}
            <Route element={<GuestRoute />}>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* ====================================
                Protected App Routes
                ==================================== */}
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppLayout />}>
                {/* Dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Customers */}
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/new" element={<CustomerFormPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="customers/:id/edit" element={<CustomerFormPage />} />

                {/* Services */}
                <Route path="services" element={<ServicesPage />} />
                <Route path="services/new" element={<ServiceFormPage />} />
                <Route path="services/:id" element={<ServiceDetailPage />} />
                <Route path="services/:id/edit" element={<ServiceFormPage />} />

                {/* Billing */}
                <Route path="billing" element={<BillingPage />} />
                <Route path="billing/new" element={<InvoiceFormPage />} />
                <Route path="billing/:id" element={<InvoiceDetailPage />} />

                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* 404 — redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
