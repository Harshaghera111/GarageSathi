/**
 * Settings Store — GarageSathi
 *
 * Zustand store for managing settings state.
 */

import { create } from 'zustand';
import * as settingsService from '@/services/settingsService';

export const useSettingsStore = create((set, get) => ({
  settings: { ...settingsService.DEFAULT_SETTINGS },
  loading: false,
  error: null,

  fetchSettings: async (garageId) => {
    set({ loading: true, error: null });
    try {
      const data = await settingsService.getSettings(garageId);
      set({ settings: data, loading: false });
    } catch (err) {
      console.error('Fetch settings error:', err);
      set({ error: err.message, loading: false });
    }
  },

  updateSettings: async (garageId, settingsData) => {
    set({ loading: true, error: null });
    try {
      await settingsService.updateSettings(garageId, settingsData);
      set({ settings: { ...get().settings, ...settingsData }, loading: false });
    } catch (err) {
      console.error('Update settings error:', err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  reset: () =>
    set({
      settings: { ...settingsService.DEFAULT_SETTINGS },
      loading: false,
      error: null,
    }),
}));
