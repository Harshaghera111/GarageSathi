/**
 * AppLayout — GarageSathi
 *
 * Master shell for all authenticated pages.
 *
 * Layout:
 *   - Desktop (≥768 md): Fixed left sidebar + main content area
 *   - Mobile (<768 md): Full-width content + sticky bottom navigation bar
 *
 * The sidebar / bottom nav items are defined once in NAV_ITEMS.
 * Active item is determined by the current pathname.
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { logout } from '@/services/authService';
import toast from 'react-hot-toast';

// ====================================
// Navigation items shared across
// sidebar (desktop) and bottom bar (mobile)
// ====================================
const NAV_ITEMS = [
  { to: '/app/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/customers',  label: 'Customers',  icon: Users           },
  { to: '/app/services',   label: 'Services',   icon: Wrench          },
  { to: '/app/billing',    label: 'Billing',    icon: Receipt         },
  { to: '/app/settings',   label: 'Settings',   icon: Settings        },
];

// ====================================
// Sidebar link (desktop)
// ====================================
function SidebarLink({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/app/dashboard'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors duration-150 ${
          isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-600 hover:bg-surface-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
          <span className="truncate">{label}</span>
          {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary-400" />}
        </>
      )}
    </NavLink>
  );
}

// ====================================
// Bottom bar link (mobile)
// ====================================
function BottomNavLink({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/app/dashboard'}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors duration-150 ${
          isActive ? 'text-primary-600' : 'text-gray-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-6 h-6 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, garageName, clearUser } = useAuthStore();
  // C4 FIX: Grab reset actions from all data stores.
  // Calling them on logout prevents the next user from seeing stale data.
  const resetCustomers = useCustomerStore((s) => s.reset);
  const resetServices = useServiceStore((s) => s.reset);
  const resetInvoices = useInvoiceStore((s) => s.reset);
  const resetSettings = useSettingsStore((s) => s.reset);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      // Reset all Zustand stores before clearing auth state
      resetCustomers();
      resetServices();
      resetInvoices();
      resetSettings();
      clearUser();
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  }

  // Mobile nav shows only first 4 items (Settings in hamburger)
  const bottomNavItems = NAV_ITEMS.slice(0, 4);

  return (
    <div className="min-h-screen bg-surface-100 flex">

      {/* ===========================
          DESKTOP SIDEBAR
          Hidden on mobile (md:flex)
      =========================== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-surface-200 fixed inset-y-0 left-0 z-30">

        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-200">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">GarageSathi</p>
            <p className="text-xs text-gray-400 truncate">{garageName || 'My Garage'}</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <SidebarLink key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-surface-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-semibold text-xs">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.displayName || 'Garage Owner'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 font-medium transition-colors duration-150"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ===========================
          MOBILE TOP HEADER
          Shown only on mobile
      =========================== */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-surface-200 z-30 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">GarageSathi</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-surface-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ===========================
          MOBILE SLIDE-OVER MENU
      =========================== */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="md:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
              <span className="font-bold text-gray-900">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-surface-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User info in drawer */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-bold text-sm">
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.displayName || 'Garage Owner'}
                </p>
                <p className="text-xs text-gray-400 truncate">{garageName || 'My Garage'}</p>
              </div>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <SidebarLink
                  key={to}
                  to={to}
                  label={label}
                  Icon={Icon}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>

            {/* Drawer logout */}
            <div className="px-3 py-4 border-t border-surface-200">
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===========================
          MAIN CONTENT AREA
      =========================== */}
      <main
        className={[
          'flex-1 min-w-0',
          'md:ml-64',          // offset for desktop sidebar
          'pt-14 md:pt-0',     // offset for mobile top header
          'pb-20 md:pb-0',     // offset for mobile bottom nav
        ].join(' ')}
      >
        {/* Inner scroll wrapper */}
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* ===========================
          MOBILE BOTTOM NAV BAR
          Shown only on mobile
      =========================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 z-30 flex pb-safe">
        {bottomNavItems.map(({ to, label, icon: Icon }) => (
          <BottomNavLink key={to} to={to} label={label} Icon={Icon} />
        ))}
      </nav>
    </div>
  );
}
