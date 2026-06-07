/**
 * ServiceDetailPage — GarageSathi
 *
 * Full implementation for service record detailed view.
 * Displays diagnostic info, cost items, auto-updating status dropdown,
 * and quick actions (Call, WhatsApp, Edit, invoice placeholder).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Edit2,
  Phone,
  MessageCircle,
  MessageSquare,
  Wrench,
  User,
  Bike,
  Gauge,
  FileText,
  IndianRupee,
  Clock,
  Briefcase,
  Send,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getService } from '@/services/serviceService';
import {
  formatPhone,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatVehicleNumber,
} from '@/utils/formatters';
import { openWhatsApp } from '@/utils/whatsapp';
import {
  buildReceivedMessage,
  buildInspectionReportMessage,
  buildApprovalRequestMessage,
  buildWorkStartedMessage,
  buildReadyForPickupMessage,
  buildInvoiceSummaryMessage,
} from '@/utils/messageTemplates';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
} from '@/config/constants';

export default function ServiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { garageId } = useAuthStore();
  // C2 FIX: Use the Zustand store so that status updates propagate to the
  // service list and dashboard counts without requiring a manual navigation.
  const updateServiceInStore = useServiceStore((s) => s.updateService);
  const settings = useSettingsStore((s) => s.settings);
  const garageName = settings?.garageName || 'GarageSathi Partner Garage';

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load service details on mount
  useEffect(() => {
    async function loadServiceData() {
      if (!garageId || !id) return;
      try {
        setLoading(true);
        const data = await getService(garageId, id);
        if (!data) {
          toast.error('Service record not found');
          navigate('/app/services');
          return;
        }
        setService(data);
      } catch (err) {
        console.error('Error fetching service details:', err);
        toast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    }

    loadServiceData();
  }, [garageId, id, navigate]);

  // Handle instant status change
  // C2 FIX: Calls Zustand store so the service list stays in sync.
  // H4 FIX: Refetches the service from Firestore after update so the
  //         displayed updatedAt timestamp is real, not a client-faked value.
  const handleStatusChange = async (newStatus) => {
    if (!garageId || !id || !service) return;

    setUpdatingStatus(true);
    try {
      // 1. Write to Firestore AND update the Zustand store's service list
      await updateServiceInStore(garageId, id, { status: newStatus });
      // 2. Refetch this single document to get the real server-generated updatedAt
      const refreshed = await getService(garageId, id);
      if (refreshed) setService(refreshed);
      toast.success(`Job status updated to ${SERVICE_STATUS_LABELS[newStatus]}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update service status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <Loader fullPage text="Loading service details..." />;
  }

  if (!service) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 font-semibold">Service record could not be loaded.</p>
        <button onClick={() => navigate('/app/services')} className="btn-secondary mt-4">
          Back to Services
        </button>
      </div>
    );
  }

  const labor = service.laborCharge || 0;
  const parts = service.partsCharge || 0;
  const totalCost = labor + parts;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/services')}
            className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
            aria-label="Back to services"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType || 'Service Details'}
            </h1>
            <div className="flex flex-wrap gap-x-2 text-[11px] text-gray-400 mt-0.5 font-medium">
              <span>Created: {formatDateTime(service.createdAt)}</span>
              {service.updatedAt && (
                <>
                  <span>•</span>
                  <span>Updated: {formatDateTime(service.updatedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => navigate(`/app/services/${service.id}/edit`)}
          className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
          title="Edit service details"
        >
          <Edit2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Status Management Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
          <Clock className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-gray-900">Job Status Tracker</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Badge Display */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-medium">Current Status:</span>
            <Badge variant={SERVICE_STATUS_COLORS[service.status] || 'neutral'}>
              {SERVICE_STATUS_LABELS[service.status] || service.status}
            </Badge>
          </div>

          {/* Quick Updater Dropdown */}
          <div className="relative">
            <select
              value={service.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="input-field py-2 text-sm font-semibold rounded-xl"
            >
              <option value="received">Received</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_parts">Waiting Parts</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
            </select>
            {updatingStatus && (
              <span className="absolute right-9 top-3 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        <div className="text-[11px] text-gray-400 font-medium">
          Last Updated: {service.updatedAt ? formatDateTime(service.updatedAt) : formatDate(service.createdAt)}
        </div>
      </div>

      {/* Grid: Customer Summary & Vehicle Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Info Card */}
        <div className="card space-y-3.5">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-2">
            <User className="w-4.5 h-4.5 text-primary-500" />
            <h3 className="font-bold text-gray-900 text-sm">Customer Profile</h3>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{service.customerName || 'Unknown Customer'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{service.customerPhone ? formatPhone(service.customerPhone) : 'No phone'}</p>
          </div>

          {/* Quick Contacts */}
          {service.customerPhone && (
            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${service.customerPhone}`}
                className="btn-secondary py-2 text-xs flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-surface-50"
              >
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>Call</span>
              </a>
              <button
                onClick={() => openWhatsApp(service.customerPhone, `Hi ${service.customerName}, update on service for ${service.vehicleNumber}...`)}
                className="btn-secondary py-2 text-xs flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-surface-50"
              >
                <MessageCircle className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                <span>WhatsApp</span>
              </button>
            </div>
          )}
        </div>

        {/* Vehicle Info Card */}
        <div className="card space-y-3.5">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-2">
            <Bike className="w-4.5 h-4.5 text-primary-500" />
            <h3 className="font-bold text-gray-900 text-sm">Vehicle Specifications</h3>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-900 tracking-wide text-base">
              {formatVehicleNumber(service.vehicleNumber)}
            </p>
            <p className="text-xs text-gray-500">{service.vehicleBrand} {service.vehicleModel}</p>
          </div>
          <div className="pt-1 text-xs text-gray-500 font-medium flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span>Odometer At Entry: <strong className="text-gray-900 font-semibold">{service.odometer?.toLocaleString('en-IN') || 0} km</strong></span>
          </div>
        </div>
      </div>

      {/* Service Details Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
          <Wrench className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-gray-900">Diagnostics & Remarks</h2>
        </div>

        <div className="space-y-4 text-sm">
          {/* Complaints */}
          <div>
            <span className="text-gray-400 block text-xs font-semibold mb-1">Problem Description / Complaints</span>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 flex gap-2 items-start">
              <FileText className="w-4.5 h-4.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800 leading-relaxed">{service.problemDescription}</span>
            </div>
          </div>

          {/* Work Notes */}
          <div>
            <span className="text-gray-400 block text-xs font-semibold mb-1">Mechanic Work Notes</span>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              {service.workNotes ? (
                <span className="text-gray-800 leading-relaxed">{service.workNotes}</span>
              ) : (
                <span className="text-gray-400 italic">No notes added by mechanic yet</span>
              )}
            </div>
          </div>

          {/* Mechanic */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pt-1">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>Assigned Mechanic: <strong className="text-gray-900 font-semibold">{service.assignedMechanic || 'Unassigned'}</strong></span>
          </div>
        </div>
      </div>

      {/* Cost Summary Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
          <IndianRupee className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-gray-900">Cost Structure</h2>
        </div>

        <div className="divide-y divide-surface-100 text-sm">
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Estimated Cost</span>
            <span className="font-bold text-gray-700">{formatCurrency(service.estimatedCost || 0)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Labor Charge</span>
            <span className="font-bold text-gray-700">{formatCurrency(labor)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Parts Charge</span>
            <span className="font-bold text-gray-700">{formatCurrency(parts)}</span>
          </div>
          <div className="py-3 flex justify-between items-center bg-surface-50 -mx-4 px-4 font-bold text-base">
            <span className="text-primary-800">Total Actual Cost</span>
            <span className="text-primary-800 text-lg">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* ================================================
           Customer Communication Center
           ================================================ */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
          <MessageSquare className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-900">Customer Communication</h2>
          {!service.customerPhone && (
            <span className="ml-auto text-[11px] font-medium text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
              Phone missing
            </span>
          )}
        </div>

        {!service.customerPhone && (
          <p className="text-xs text-gray-400 italic -mt-1">
            Add a customer phone number to enable WhatsApp messages.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 1. Send Received Message */}
          <button
            id="btn-wa-received"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(
                service.customerPhone,
                buildReceivedMessage(service, garageName)
              );
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 text-green-600" />
            </span>
            <span>Send Received Message</span>
          </button>

          {/* 2. Send Inspection Report */}
          <button
            id="btn-wa-inspection"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(
                service.customerPhone,
                buildInspectionReportMessage(service, garageName)
              );
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </span>
            <span>Send Inspection Report</span>
          </button>

          {/* 3. Send Approval Request */}
          <button
            id="btn-wa-approval"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(
                service.customerPhone,
                buildApprovalRequestMessage(service, garageName)
              );
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-amber-600" />
            </span>
            <span>Send Approval Request</span>
          </button>

          {/* 4. Send Work Started Message */}
          <button
            id="btn-wa-work-started"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(
                service.customerPhone,
                buildWorkStartedMessage(service, garageName)
              );
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-4 h-4 text-orange-600" />
            </span>
            <span>Send Work Started Message</span>
          </button>

          {/* 5. Send Ready For Pickup Message */}
          <button
            id="btn-wa-pickup"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(
                service.customerPhone,
                buildReadyForPickupMessage(service, garageName)
              );
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Bike className="w-4 h-4 text-green-600" />
            </span>
            <span>Send Ready For Pickup</span>
          </button>

          {/* 6. Send Invoice Summary */}
          <button
            id="btn-wa-invoice"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(
                service.customerPhone,
                buildInvoiceSummaryMessage(service, garageName)
              );
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-4 h-4 text-purple-600" />
            </span>
            <span>Send Invoice Summary</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 font-medium text-center">
          Opens WhatsApp with pre-filled message. You send it manually.
        </p>
      </div>

      {/* Generate or View Invoice */}
      <div className="pt-2">
        {service.invoiceId ? (
          <button
            onClick={() => navigate(`/app/billing/${service.invoiceId}`)}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            <span>View Invoice ({service.invoiceNumber})</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/app/billing/new', { state: { service } })}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            <span>Generate Invoice</span>
          </button>
        )}
      </div>
    </div>
  );
}
