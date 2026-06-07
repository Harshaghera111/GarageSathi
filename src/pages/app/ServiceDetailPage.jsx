/**
 * ServiceDetailPage — GarageSathi
 *
 * Full implementation for service record detailed view.
 * Phase 1: Customer Communication Center (WhatsApp message templates).
 * Phase 2: Customer Approval Workflow (approval status, guards, audit trail).
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
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getService } from '@/services/serviceService';
import { updateApprovalStatus } from '@/services/serviceService';
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
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/config/constants';

// ---------------------------------------------------------------------------
// Helper: resolve approvalStatus safely (backward compat with old records)
// ---------------------------------------------------------------------------
function getApprovalStatus(service) {
  return service?.approvalStatus || 'not_required';
}

export default function ServiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { garageId } = useAuthStore();
  const updateServiceInStore = useServiceStore((s) => s.updateService);
  const settings = useSettingsStore((s) => s.settings);
  const garageName = settings?.garageName || 'GarageSathi Partner Garage';

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingApproval, setUpdatingApproval] = useState(false);

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

  // -------------------------------------------------------------------------
  // Handle job status change — guarded by approval workflow
  // -------------------------------------------------------------------------
  const handleStatusChange = async (newStatus) => {
    if (!garageId || !id || !service) return;

    const approval = getApprovalStatus(service);

    // Block completion/delivery if approval is pending
    if (approval === 'pending' && (newStatus === 'completed' || newStatus === 'delivered')) {
      toast.error('Customer approval is pending. Cannot proceed to Completed or Delivered.');
      return;
    }

    // Block completion if approval was rejected
    if (approval === 'rejected' && (newStatus === 'completed' || newStatus === 'delivered')) {
      toast.error('Repair was rejected by customer. Cannot mark as Completed or Delivered.');
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateServiceInStore(garageId, id, { status: newStatus });
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

  // -------------------------------------------------------------------------
  // Handle approval status update
  // -------------------------------------------------------------------------
  const handleApprovalUpdate = async (newApprovalStatus) => {
    if (!garageId || !id || !service) return;

    const labels = {
      pending: 'Mark as Pending Approval',
      approved: 'Mark as Approved',
      rejected: 'Mark as Rejected',
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${labels[newApprovalStatus] || 'update'}?\n\nThis will update the approval status for:\n${service.customerName} — ${service.vehicleNumber}`
    );
    if (!confirmed) return;

    setUpdatingApproval(true);
    try {
      await updateApprovalStatus(garageId, id, newApprovalStatus);
      const refreshed = await getService(garageId, id);
      if (refreshed) setService(refreshed);
      toast.success(`Approval status updated to ${APPROVAL_STATUS_LABELS[newApprovalStatus]}`);
    } catch (err) {
      console.error('Error updating approval status:', err);
      toast.error('Failed to update approval status');
    } finally {
      setUpdatingApproval(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handle "Send Approval Request" WhatsApp — auto-sets pending first
  // -------------------------------------------------------------------------
  const handleSendApprovalRequest = async () => {
    if (!service.customerPhone) {
      toast.error('Customer phone number not available.');
      return;
    }

    // Auto-set approvalStatus = pending + approvalRequestedAt before opening WA
    try {
      await updateApprovalStatus(garageId, id, 'pending');
      const refreshed = await getService(garageId, id);
      if (refreshed) setService(refreshed);
    } catch (err) {
      console.error('Error setting approval pending:', err);
      // Still proceed to open WhatsApp even if Firestore write fails
    }

    openWhatsApp(service.customerPhone, buildApprovalRequestMessage(service, garageName));
  };

  // -------------------------------------------------------------------------
  // Guard: invoice generation
  // -------------------------------------------------------------------------
  const handleGenerateInvoice = () => {
    const approval = getApprovalStatus(service);
    if (approval === 'pending') {
      toast.error('Customer approval is pending. Cannot generate invoice.');
      return;
    }
    if (approval === 'rejected') {
      toast.error('Repair was rejected by customer. Cannot generate invoice.');
      return;
    }
    navigate('/app/billing/new', { state: { service } });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
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
  const approvalStatus = getApprovalStatus(service);

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

        <button
          onClick={() => navigate(`/app/services/${service.id}/edit`)}
          className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
          title="Edit service details"
        >
          <Edit2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* =====================================================
           PHASE 2 — Customer Approval Card
           ===================================================== */}
      <div className={`card space-y-4 ${
        approvalStatus === 'pending'
          ? 'border-amber-300 bg-amber-50'
          : approvalStatus === 'rejected'
          ? 'border-red-300 bg-red-50'
          : approvalStatus === 'approved'
          ? 'border-green-300 bg-green-50'
          : ''
      }`}>
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
          <ShieldCheck className={`w-5 h-5 ${
            approvalStatus === 'approved' ? 'text-green-600'
            : approvalStatus === 'rejected' ? 'text-red-500'
            : approvalStatus === 'pending' ? 'text-amber-500'
            : 'text-gray-400'
          }`} />
          <h2 className="font-semibold text-gray-900">Customer Approval</h2>
          <div className="ml-auto">
            <Badge variant={APPROVAL_STATUS_COLORS[approvalStatus]}>
              {approvalStatus === 'approved' && '✅ '}
              {approvalStatus === 'pending' && '⏳ '}
              {approvalStatus === 'rejected' && '❌ '}
              {approvalStatus === 'not_required' && '⚪ '}
              {APPROVAL_STATUS_LABELS[approvalStatus]}
            </Badge>
          </div>
        </div>

        {/* Alert banners */}
        {approvalStatus === 'pending' && (
          <div className="flex items-start gap-2 p-3 bg-amber-100 border border-amber-300 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              Waiting for customer response. Invoice generation and job completion are blocked until the customer approves.
            </p>
          </div>
        )}
        {approvalStatus === 'rejected' && (
          <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-xl">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 font-medium">
              Customer has rejected the repair. Invoice generation and job completion are blocked.
            </p>
          </div>
        )}
        {approvalStatus === 'approved' && (
          <div className="flex items-start gap-2 p-3 bg-green-100 border border-green-300 rounded-xl">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 font-medium">
              Customer has approved the repair. You may proceed with completing the job.
            </p>
          </div>
        )}

        {/* Audit Trail */}
        <div className="space-y-1.5 text-xs text-gray-500">
          {service.approvalRequestedAt && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>
                <span className="font-semibold text-gray-700">Approval Requested:</span>{' '}
                {formatDateTime(service.approvalRequestedAt)}
              </span>
            </div>
          )}
          {service.approvalApprovedAt && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span>
                <span className="font-semibold text-gray-700">Approved:</span>{' '}
                {formatDateTime(service.approvalApprovedAt)}
              </span>
            </div>
          )}
          {service.approvalRejectedAt && (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span>
                <span className="font-semibold text-gray-700">Rejected:</span>{' '}
                {formatDateTime(service.approvalRejectedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {approvalStatus !== 'approved' && (
            <button
              id="btn-approval-approve"
              onClick={() => handleApprovalUpdate('approved')}
              disabled={updatingApproval}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Approved
            </button>
          )}
          {approvalStatus !== 'rejected' && (
            <button
              id="btn-approval-reject"
              onClick={() => handleApprovalUpdate('rejected')}
              disabled={updatingApproval}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Mark Rejected
            </button>
          )}
          {approvalStatus !== 'pending' && (
            <button
              id="btn-approval-pending"
              onClick={() => handleApprovalUpdate('pending')}
              disabled={updatingApproval}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              Mark Pending
            </button>
          )}
        </div>
      </div>

      {/* Status Management Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
          <Clock className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-gray-900">Job Status Tracker</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-medium">Current Status:</span>
            <Badge variant={SERVICE_STATUS_COLORS[service.status] || 'neutral'}>
              {SERVICE_STATUS_LABELS[service.status] || service.status}
            </Badge>
          </div>

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

        {/* Guard hint */}
        {(approvalStatus === 'pending' || approvalStatus === 'rejected') && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">
            ⚠️ Completed and Delivered statuses are blocked while approval is{' '}
            <strong>{APPROVAL_STATUS_LABELS[approvalStatus].toLowerCase()}</strong>.
          </p>
        )}

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
          <h2 className="font-semibold text-gray-900">Diagnostics &amp; Remarks</h2>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <span className="text-gray-400 block text-xs font-semibold mb-1">Problem Description / Complaints</span>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 flex gap-2 items-start">
              <FileText className="w-4.5 h-4.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-800 leading-relaxed">{service.problemDescription}</span>
            </div>
          </div>

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

      {/* =====================================================
           PHASE 1 — Customer Communication Center
           ===================================================== */}
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
              openWhatsApp(service.customerPhone, buildReceivedMessage(service, garageName));
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
              openWhatsApp(service.customerPhone, buildInspectionReportMessage(service, garageName));
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </span>
            <span>Send Inspection Report</span>
          </button>

          {/* 3. Send Approval Request — auto-sets pending */}
          <button
            id="btn-wa-approval"
            onClick={handleSendApprovalRequest}
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
              openWhatsApp(service.customerPhone, buildWorkStartedMessage(service, garageName));
            }}
            disabled={!service.customerPhone}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-surface-200 bg-white text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-4 h-4 text-orange-600" />
            </span>
            <span>Send Work Started Message</span>
          </button>

          {/* 5. Send Ready For Pickup */}
          <button
            id="btn-wa-pickup"
            onClick={() => {
              if (!service.customerPhone) {
                toast.error('Customer phone number not available.');
                return;
              }
              openWhatsApp(service.customerPhone, buildReadyForPickupMessage(service, garageName));
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
              openWhatsApp(service.customerPhone, buildInvoiceSummaryMessage(service, garageName));
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

      {/* Generate or View Invoice — guarded by approval */}
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
            id="btn-generate-invoice"
            onClick={handleGenerateInvoice}
            disabled={approvalStatus === 'pending' || approvalStatus === 'rejected'}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            <span>
              {approvalStatus === 'pending'
                ? 'Invoice Blocked (Pending Approval)'
                : approvalStatus === 'rejected'
                ? 'Invoice Blocked (Repair Rejected)'
                : 'Generate Invoice'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
