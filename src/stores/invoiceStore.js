/**
 * Invoice Store — GarageSathi
 *
 * Zustand store for invoice state management.
 */

import { create } from 'zustand';
import * as invoiceService from '@/services/invoiceService';

export const useInvoiceStore = create((set, get) => ({
  // State
  invoices: [],
  loading: false,
  error: null,
  searchTerm: '',
  statusFilter: 'all',
  lastDoc: null,
  hasMore: true,

  // Actions
  fetchInvoices: async (garageId, options = {}) => {
    const status = options.status || get().statusFilter;
    set({ loading: true, error: null, statusFilter: status, searchTerm: '' });

    try {
      const result = await invoiceService.getInvoices(garageId, { status });
      set({
        invoices: result.invoices,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch invoices error:', error);
      set({ error: error.message, loading: false });
    }
  },

  loadMore: async (garageId) => {
    const { lastDoc, hasMore, invoices, statusFilter } = get();
    if (!hasMore || !lastDoc) return;

    set({ loading: true });
    try {
      const result = await invoiceService.getInvoices(garageId, {
        lastDoc,
        status: statusFilter,
      });
      set({
        invoices: [...invoices, ...result.invoices],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('Load more error:', error);
      set({ error: error.message, loading: false });
    }
  },

  searchInvoices: async (garageId, term) => {
    const status = get().statusFilter;
    set({ searchTerm: term, loading: true });

    try {
      if (!term.trim()) {
        const result = await invoiceService.getInvoices(garageId, { status });
        set({
          invoices: result.invoices,
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          loading: false,
        });
      } else {
        const results = await invoiceService.searchInvoices(garageId, term);
        // Apply status filter locally if status is set
        const filtered = status === 'all' 
          ? results 
          : results.filter(i => i.paymentStatus === status);
        set({
          invoices: filtered,
          hasMore: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createInvoice: async (garageId, data) => {
    set({ loading: true, error: null });
    try {
      const { id, invoiceNumber } = await invoiceService.createInvoice(garageId, data);
      await get().fetchInvoices(garageId);
      set({ loading: false });
      return id;
    } catch (error) {
      console.error('Create invoice error:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateInvoice: async (garageId, invoiceId, updates) => {
    try {
      await invoiceService.updateInvoice(garageId, invoiceId, updates);
      // Update local state instead of full refetch to optimize reads
      const updatedInvoices = get().invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, ...updates } : inv
      );
      set({ invoices: updatedInvoices });
    } catch (error) {
      console.error('Update invoice error:', error);
      set({ error: error.message });
      throw error;
    }
  },

  setStatusFilter: (status) => set({ statusFilter: status }),

  reset: () =>
    set({
      invoices: [],
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      lastDoc: null,
      hasMore: true,
    }),
}));
