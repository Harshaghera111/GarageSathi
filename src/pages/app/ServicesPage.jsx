/**
 * ServicesPage — GarageSathi
 *
 * Full implementation for directory list of all service records.
 * Supports status tabs filter, debounced search, pagination, and status badges.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wrench, ChevronRight, Edit2 } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useServiceStore } from '@/stores/serviceStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/config/constants';
import PageHeader from '@/components/common/PageHeader';
import SearchBar from '@/components/common/SearchBar';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import Badge from '@/components/common/Badge';

export default function ServicesPage() {
  const navigate = useNavigate();
  const { garageId } = useAuthStore();
  const {
    services,
    loading,
    hasMore,
    statusFilter,
    fetchServices,
    searchServices,
    loadMore,
  } = useServiceStore();

  const [searchTerm, setSearchTerm] = useState('');
  // H3/M1 FIX: Use a ref for the debounce timer instead of state to avoid
  // a re-render on every keystroke, and to safely clear on unmount.
  const searchTimeoutRef = useRef(null);

  // Load services on mount or status filter change
  useEffect(() => {
    if (garageId) {
      fetchServices(garageId, statusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garageId, statusFilter]);

  // Debounced search
  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(() => {
        // H3 FIX: Guard against null garageId inside the async callback.
        // garageId could be null during session re-hydration; without this guard
        // Firestore would attempt to query 'garages/null/services'.
        if (!garageId) return;
        searchServices(garageId, term);
      }, 400);
    },
    [garageId, searchServices]
  );

  // Status Filter Change
  const handleStatusTabClick = (status) => {
    if (garageId) {
      setSearchTerm(''); // Clear search on tab switch
      fetchServices(garageId, status);
    }
  };

  // Status Tab List
  const tabs = [
    { value: null, label: 'All' },
    { value: 'received', label: 'Received' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_parts', label: 'Waiting Parts' },
    { value: 'completed', label: 'Completed' },
    { value: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <PageHeader title="Services" subtitle={`${services.length} records loaded`}>
        <button
          onClick={() => navigate('/app/services/new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          New
        </button>
      </PageHeader>

      {/* Search and Status Filters */}
      <div className="space-y-3 mb-6">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search customer, vehicle, or mechanic..."
        />

        {/* Status Scrollbar Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value || 'all'}
                onClick={() => handleStatusTabClick(tab.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'bg-white text-gray-600 border-surface-200 hover:bg-surface-50 active:bg-surface-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services List rendering */}
      {loading && services.length === 0 ? (
        <Loader text="Loading services directory..." />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={searchTerm ? 'No search results' : 'No service records'}
          description={
            searchTerm
              ? 'Try checking spelling or changing the search query'
              : statusFilter
              ? `No service records are currently in "${SERVICE_STATUS_LABELS[statusFilter]}" status`
              : 'Create a new service job to track repairs and billing'
          }
          actionLabel={searchTerm ? 'Clear Search' : 'New Service'}
          onAction={() => {
            if (searchTerm) {
              handleSearch('');
            } else {
              navigate('/app/services/new');
            }
          }}
        />
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            // Calculations
            const labor = service.laborCharge || 0;
            const parts = service.partsCharge || 0;
            const totalCost = labor + parts;

            return (
              <div
                key={service.id}
                onClick={() => navigate(`/app/services/${service.id}`)}
                className="card flex items-center justify-between gap-4 cursor-pointer active:bg-surface-50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Customer & Status row */}
                  <div className="flex items-center gap-2 justify-between">
                    <p className="font-semibold text-gray-900 truncate">
                      {service.customerName || 'Unknown Customer'}
                    </p>
                    <Badge variant={SERVICE_STATUS_COLORS[service.status] || 'neutral'}>
                      {SERVICE_STATUS_LABELS[service.status] || service.status}
                    </Badge>
                  </div>

                  {/* Vehicle detail */}
                  <p className="text-sm text-gray-500 font-medium truncate">
                    {service.vehicleNumber} • {service.vehicleModel}
                  </p>

                  {/* Service details row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                    <span>
                      Type: {SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType || 'General'}
                    </span>
                    <span>•</span>
                    <span>Mech: {service.assignedMechanic || 'Unassigned'}</span>
                    <span>•</span>
                    <span>{formatDate(service.createdAt)}</span>
                  </div>

                  {/* Approval status badge — only when relevant */}
                  {(() => {
                    const aStatus = service.approvalStatus || 'not_required';
                    if (aStatus === 'not_required') return null;
                    return (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant={APPROVAL_STATUS_COLORS[aStatus]}>
                          {aStatus === 'pending' && '⏳ '}
                          {aStatus === 'approved' && '✅ '}
                          {aStatus === 'rejected' && '❌ '}
                          {APPROVAL_STATUS_LABELS[aStatus]}
                        </Badge>
                      </div>
                    );
                  })()}
                </div>

                {/* Right side: Amount and edit button */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right mr-1">
                    <p className="font-bold text-gray-900 text-base">
                      {formatCurrency(totalCost)}
                    </p>
                    {service.estimatedCost > 0 && (
                      <p className="text-[10px] text-gray-400">
                        Est: {formatCurrency(service.estimatedCost)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/app/services/${service.id}/edit`)}
                    className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 active:bg-surface-300 transition-colors"
                    title="Edit Service Record"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            );
          })}

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
        </div>
      )}
    </div>
  );
}
