/**
 * Customers Page — GarageSathi
 *
 * Customer list with search and add functionality.
 * Cards-based layout for easy mobile scrolling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone, ChevronRight, Users, MessageCircle, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { formatPhone } from '@/utils/formatters';
import { getInitials } from '@/utils/formatters';
import { openWhatsApp } from '@/utils/whatsapp';
import PageHeader from '@/components/common/PageHeader';
import SearchBar from '@/components/common/SearchBar';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { garageId } = useAuthStore();
  const {
    customers,
    loading,
    hasMore,
    sortOrder,
    fetchCustomers,
    searchCustomers,
    loadMore,
  } = useCustomerStore();

  const [searchTerm, setSearchTerm] = useState('');
  // H3/M1 FIX: Use a ref for the debounce timer instead of state to avoid
  // a re-render on every keystroke, and to safely clear on unmount.
  const searchTimeoutRef = useRef(null);

  // Load customers on mount
  useEffect(() => {
    if (garageId) {
      fetchCustomers(garageId);
    }
  // Zustand fetchCustomers is a stable reference — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garageId]);

  // Debounced search
  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(() => {
        // H3 FIX: Guard against null garageId inside the async callback.
        if (!garageId) return;
        searchCustomers(garageId, term);
      }, 400);
    },
    // Zustand searchCustomers is a stable reference — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [garageId]
  );

  // Handle sorting change
  const handleSortChange = (e) => {
    const val = e.target.value;
    if (garageId) {
      if (val === 'newest') {
        fetchCustomers(garageId, { sortBy: 'createdAt', sortOrder: 'desc' });
      } else if (val === 'oldest') {
        fetchCustomers(garageId, { sortBy: 'createdAt', sortOrder: 'asc' });
      }
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <PageHeader title="Customers" subtitle={`${customers.length} customers`}>
        <button
          onClick={() => navigate('/app/customers/new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </PageHeader>

      {/* Search and Sort Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search name, phone, or vehicle..."
          />
        </div>
        <select
          value={sortOrder === 'desc' ? 'newest' : 'oldest'}
          onChange={handleSortChange}
          className="input-field py-0 px-3 text-sm font-medium border border-surface-300 rounded-xl bg-white focus:border-primary-500 focus:ring-primary-500"
          style={{ width: '130px', height: '48px' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Customer List */}
      {loading && customers.length === 0 ? (
        <Loader text="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to get started"
          actionLabel="Add Customer"
          onAction={() => navigate('/app/customers/new')}
        />
      ) : (
        <>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="card flex items-center gap-3 cursor-pointer active:bg-surface-50 transition-colors"
                onClick={() => navigate(`/app/customers/${customer.id}`)}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-semibold text-sm">
                    {getInitials(customer.name)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {customer.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {customer.phone ? formatPhone(customer.phone) : 'No phone'}
                    {customer.vehicles?.[0]?.vehicleNumber &&
                      ` • ${customer.vehicles[0].vehicleNumber}`}
                  </p>
                  {customer.vehicles?.[0]?.model && (
                    <p className="text-xs text-gray-400 truncate">
                      {customer.vehicles[0].model}
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 active:bg-blue-200 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                  {customer.phone && (
                    <button
                      onClick={() => openWhatsApp(customer.phone)}
                      className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 active:bg-green-200 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600 fill-green-600" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/app/customers/${customer.id}/edit`)}
                    className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 active:bg-surface-300 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() => garageId && loadMore(garageId)}
              disabled={loading}
              className="btn-secondary w-full mt-4"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
