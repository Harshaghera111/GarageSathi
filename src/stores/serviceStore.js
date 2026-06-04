/**
 * Service Store — GarageSathi
 *
 * Zustand store for service records.
 */

import { create } from 'zustand';
import * as serviceService from '@/services/serviceService';

export const useServiceStore = create((set, get) => ({
  // State
  services: [],
  selectedService: null,
  todayServices: [],
  loading: false,
  error: null,
  statusFilter: null, // null = all
  lastDoc: null,
  hasMore: true,
  searchTerm: '',

  // Actions

  fetchServices: async (garageId, status = null) => {
    set({ loading: true, error: null, statusFilter: status });
    try {
      const result = await serviceService.getServices(garageId, { status });
      set({
        services: result.services,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch services error:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchTodayServices: async (garageId) => {
    try {
      const services = await serviceService.getTodayServices(garageId);
      set({ todayServices: services });
    } catch (error) {
      console.error('Fetch today services error:', error);
    }
  },

  searchServices: async (garageId, term) => {
    set({ searchTerm: term, loading: true });
    try {
      if (!term.trim()) {
        const status = get().statusFilter;
        const result = await serviceService.getServices(garageId, { status });
        set({
          services: result.services,
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          loading: false,
        });
      } else {
        const results = await serviceService.searchServices(garageId, term);
        const status = get().statusFilter;
        const filteredResults = status
          ? results.filter((s) => s.status === status)
          : results;
        set({ services: filteredResults, hasMore: false, loading: false });
      }
    } catch (error) {
      console.error('Search services error:', error);
      set({ error: error.message, loading: false });
    }
  },

  loadMore: async (garageId) => {
    const { lastDoc, hasMore, services, statusFilter } = get();
    if (!hasMore || !lastDoc) return;

    set({ loading: true });
    try {
      const result = await serviceService.getServices(garageId, {
        status: statusFilter,
        lastDoc,
      });
      set({
        services: [...services, ...result.services],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Load more error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createService: async (garageId, data) => {
    const id = await serviceService.createService(garageId, data);
    await get().fetchServices(garageId, get().statusFilter);
    return id;
  },

  updateService: async (garageId, serviceId, data) => {
    await serviceService.updateService(garageId, serviceId, data);
    await get().fetchServices(garageId, get().statusFilter);
  },

  setSelectedService: (service) => set({ selectedService: service }),

  reset: () =>
    set({
      services: [],
      selectedService: null,
      todayServices: [],
      loading: false,
      error: null,
      statusFilter: null,
      lastDoc: null,
      hasMore: true,
      searchTerm: '',
    }),
}));
