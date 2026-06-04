/**
 * Customer Store — GarageSathi
 *
 * Zustand store for customer state management.
 * Holds customer list, selected customer, search state.
 */

import { create } from 'zustand';
import * as customerService from '@/services/customerService';

export const useCustomerStore = create((set, get) => ({
  // State
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  searchTerm: '',
  lastDoc: null,
  hasMore: true,
  sortBy: 'createdAt',
  sortOrder: 'desc',

  // Actions

  /**
   * Fetch customers (first page or refresh).
   */
  fetchCustomers: async (garageId, options = {}) => {
    const sortBy = options.sortBy || get().sortBy;
    const sortOrder = options.sortOrder || get().sortOrder;
    set({ loading: true, error: null, sortBy, sortOrder });
    try {
      const result = await customerService.getCustomers(garageId, { sortBy, sortOrder });
      set({
        customers: result.customers,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch customers error:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Load more customers (pagination).
   */
  loadMore: async (garageId) => {
    const { lastDoc, hasMore, customers, sortBy, sortOrder } = get();
    if (!hasMore || !lastDoc) return;

    set({ loading: true });
    try {
      const result = await customerService.getCustomers(garageId, { lastDoc, sortBy, sortOrder });
      set({
        customers: [...customers, ...result.customers],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Load more error:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Search customers.
   */
  searchCustomers: async (garageId, term) => {
    const { sortBy, sortOrder } = get();
    set({ searchTerm: term, loading: true });
    try {
      if (!term.trim()) {
        // If search cleared, reload normal list
        const result = await customerService.getCustomers(garageId, { sortBy, sortOrder });
        set({
          customers: result.customers,
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          loading: false,
        });
      } else {
        const results = await customerService.searchCustomers(garageId, term);
        set({ customers: results, hasMore: false, loading: false });
      }
    } catch (error) {
      console.error('Search error:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Add a customer.
   */
  addCustomer: async (garageId, data) => {
    const id = await customerService.addCustomer(garageId, data);
    // Refresh list
    await get().fetchCustomers(garageId);
    return id;
  },

  /**
   * Update a customer.
   */
  updateCustomer: async (garageId, customerId, data) => {
    await customerService.updateCustomer(garageId, customerId, data);
    // Refresh list
    await get().fetchCustomers(garageId);
  },

  /**
   * Set selected customer for detail view.
   */
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

  /**
   * Clear state on logout.
   */
  reset: () =>
    set({
      customers: [],
      selectedCustomer: null,
      loading: false,
      error: null,
      searchTerm: '',
      lastDoc: null,
      hasMore: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
}));
