/**
 * BillingPage — GarageSathi
 *
 * Full implementation for invoice listing.
 * Displays invoice summary cards with payment status badges, search,
 * and status filtering (All, Pending, Paid).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, ChevronRight, Search, FileText } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import PageHeader from '@/components/common/PageHeader';
import SearchBar from '@/components/common/SearchBar';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import Badge from '@/components/common/Badge';

const PAYMENT_STATUS_COLORS = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
};

export default function BillingPage() {
  const navigate = useNavigate();
  const { garageId } = useAuthStore();
  const {
    invoices,
    loading,
    hasMore,
    statusFilter,
    fetchInvoices,
    searchInvoices,
    loadMore,
  } = useInvoiceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);

  // Load invoices on mount or status change
  useEffect(() => {
    if (garageId) {
      fetchInvoices(garageId, { status: statusFilter });
    }
  }, [garageId, statusFilter, fetchInvoices]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Debounced search handler
  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(() => {
        if (!garageId) return;
        searchInvoices(garageId, term);
      }, 400);
    },
    [garageId, searchInvoices]
  );

  // Filter change handler
  const handleStatusFilterChange = (status) => {
    if (garageId) {
      setSearchTerm('');
      fetchInvoices(garageId, { status });
    }
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      {/* Page Header */}
      <PageHeader title="Billing & Invoices" subtitle={`${invoices.length} invoices loaded`}>
        <button
          onClick={() => navigate('/app/billing/new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>New Invoice</span>
        </button>
      </PageHeader>

      {/* Search and Status Filters */}
      <div className="mt-6 space-y-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by invoice #, customer name or plate..."
        />

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-surface-200 pb-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleStatusFilterChange(tab.value)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoice Listing */}
      <div className="mt-6 space-y-3">
        {loading && invoices.length === 0 ? (
          <Loader text="Loading invoices..." />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description={
              searchTerm
                ? "Try searching for a different term or clear the filter."
                : "Generate invoices directly from completed services or create a draft."
            }
            actionLabel={searchTerm ? "Clear Search" : "Create Invoice"}
            onAction={
              searchTerm
                ? () => handleSearch('')
                : () => navigate('/app/billing/new')
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {invoices.map((inv) => {
                const colors = PAYMENT_STATUS_COLORS[inv.paymentStatus] || PAYMENT_STATUS_COLORS.pending;
                return (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/app/billing/${inv.id}`)}
                    className="card flex items-center justify-between cursor-pointer hover:border-primary-200 hover:shadow-sm transition-all duration-150 p-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {PAYMENT_STATUS_LABELS[inv.paymentStatus]}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                        <span className="font-medium text-gray-800">
                          {inv.customerInfo?.name || 'Unknown Customer'}
                        </span>
                        <span className="hidden sm:inline text-gray-300">|</span>
                        <span>{inv.vehicleInfo?.vehicleNumber || 'No Plate'}</span>
                        <span className="hidden sm:inline text-gray-300">|</span>
                        <span>
                          {inv.invoiceDate 
                            ? formatDate(inv.invoiceDate)
                            : inv.createdAt?.seconds 
                              ? formatDate(new Date(inv.createdAt.seconds * 1000))
                              : 'No Date'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">
                          {formatCurrency(inv.totalAmount || 0)}
                        </p>
                        <p className="text-[10px] text-gray-400">Total Amount</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Load More */}
            {hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => loadMore(garageId)}
                  disabled={loading}
                  className="btn-secondary w-full max-w-xs flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More Invoices</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
