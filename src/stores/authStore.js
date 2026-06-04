/**
 * Auth Store — GarageSathi
 *
 * Zustand store for authentication state.
 * Manages current user, garage context, and auth loading.
 */

import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,           // Firebase user + custom profile data
  garageId: null,       // Current garage context
  garageName: null,     // Garage name for display
  loading: true,        // Initial auth check loading
  error: null,

  // Actions
  setUser: (user) =>
    set({
      user,
      garageId: user?.garageId || null,
      garageName: user?.garageName || null,
      loading: false,
      error: null,
    }),

  clearUser: () =>
    set({
      user: null,
      garageId: null,
      garageName: null,
      loading: false,
      error: null,
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  // Getters
  isAuthenticated: () => get().user !== null,
  getUserRole: () => get().user?.role || null,
  isGarageOwner: () => get().user?.role === 'garage_owner',
  isMechanic: () => get().user?.role === 'mechanic',
}));
