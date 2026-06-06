/**
 * InvoiceFormPage — GarageSathi
 *
 * Full implementation for invoice generation from service records.
 * Auto-loads customer, vehicle and charges. Allows adding notes and
 * choosing payment status (Pending or Paid).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Receipt, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { getServices } from '@/services/serviceService';
import { formatCurrency } from '@/utils/formatters';
import Loader from '@/components/common/Loader';

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // goBack: falls back to /app/billing when opened in a fresh tab
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/app/billing'));
  const { garageId } = useAuthStore();
  const { createInvoice, loading: saving } = useInvoiceStore();

  const [selectedService, setSelectedService] = useState(null);
  const [unbilledServices, setUnbilledServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Form states
  const [laborCharge, setLaborCharge] = useState(0);
  const [partsCharge, setPartsCharge] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Load state or fetch unbilled services
  useEffect(() => {
    if (location.state?.service) {
      const service = location.state.service;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedService(service);
      setLaborCharge(service.laborCharge || 0);
      setPartsCharge(service.partsCharge || 0);
    } else if (garageId) {
      // If no preloaded service, fetch completed services to choose from
      async function loadCompletedServices() {
        try {
          setLoadingServices(true);
          // Fetch completed services (limit 50 for MVP)
          const result = await getServices(garageId, { pageSize: 50 });
          // Filter completed/delivered services that don't have an invoice yet
          const unbilled = result.services.filter(
            (s) => (s.status === 'completed' || s.status === 'delivered') && !s.invoiceId
          );
          setUnbilledServices(unbilled);
        } catch (err) {
          console.error('Error fetching services for invoicing:', err);
          toast.error('Failed to load completed services');
        } finally {
          setLoadingServices(false);
        }
      }
      loadCompletedServices();
    }
  }, [location.state, garageId]);

  // Handle service selection change
  const handleServiceSelect = (serviceId) => {
    const service = unbilledServices.find((s) => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setLaborCharge(service.laborCharge || 0);
      setPartsCharge(service.partsCharge || 0);
    } else {
      setSelectedService(null);
      setLaborCharge(0);
      setPartsCharge(0);
    }
  };

  const totalAmount = Number(laborCharge) + Number(partsCharge);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!garageId || !selectedService) {
      toast.error('Please select a service job first');
      return;
    }

    if (laborCharge < 0 || partsCharge < 0) {
      toast.error('Charges cannot be negative');
      return;
    }

    const invoiceData = {
      serviceId: selectedService.id,
      customerId: selectedService.customerId,
      customerInfo: {
        name: selectedService.customerName,
        phone: selectedService.customerPhone || '',
        address: selectedService.customerAddress || selectedService.address || '',
      },
      vehicleInfo: {
        vehicleNumber: selectedService.vehicleNumber,
        vehicleBrand: selectedService.vehicleBrand || '',
        vehicleModel: selectedService.vehicleModel || '',
        odometer: selectedService.odometer || selectedService.currentOdometer || 0,
      },
      laborCharge: Number(laborCharge),
      partsCharge: Number(partsCharge),
      subtotal: totalAmount,
      totalAmount: totalAmount,
      paymentStatus: paymentStatus,
      invoiceDate: invoiceDate,
      notes: notes,
    };

    try {
      const invoiceId = await createInvoice(garageId, invoiceData);
      toast.success('Invoice generated successfully!');
      navigate(`/app/billing/${invoiceId}`, { replace: true });
    } catch (err) {
      console.error('Error generating invoice:', err);
      if (err.code === 'ALREADY_EXISTS') {
        toast.error('An invoice already exists for this service!', { icon: '⚠️' });
        navigate(`/app/billing/${err.invoiceId}`, { replace: true });
      } else {
        toast.error('Failed to generate invoice');
      }
    }
  };

  if (loadingServices) {
    return <Loader fullPage text="Loading unbilled services..." />;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => goBack()}
          className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-xs text-gray-500">Generate invoice for service job</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Selection / Locking */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-2">
            <Receipt className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Service Reference</h2>
          </div>

          {!location.state?.service && unbilledServices.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="serviceSelect" className="text-xs font-semibold text-gray-500">
                Select Completed Service Job
              </label>
              <select
                id="serviceSelect"
                className="input-field"
                value={selectedService?.id || ''}
                onChange={(e) => handleServiceSelect(e.target.value)}
                required
              >
                <option value="">-- Choose Completed Service --</option>
                {unbilledServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.vehicleNumber} - {s.customerName} ({s.serviceType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!location.state?.service && unbilledServices.length === 0 && !selectedService && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                There are no completed or delivered services pending invoicing. Go to{' '}
                <button
                  type="button"
                  onClick={() => navigate('/app/services')}
                  className="font-bold underline"
                >
                  Services
                </button>{' '}
                to complete a job.
              </span>
            </div>
          )}

          {/* Locked / Chosen Service Details */}
          {selectedService && (
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 divide-y divide-surface-200/60 text-sm space-y-3">
              <div className="grid grid-cols-2 gap-4 pb-1">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
                    Customer Name
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedService.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
                    Vehicle Plate
                  </span>
                  <span className="font-bold text-gray-800 tracking-wide">
                    {selectedService.vehicleNumber}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 pb-1">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
                    Vehicle Model
                  </span>
                  <span className="text-gray-700">
                    {selectedService.vehicleBrand} {selectedService.vehicleModel}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
                    Service Type
                  </span>
                  <span className="text-gray-700 capitalize">
                    {selectedService.serviceType}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Date & Payment Status */}
        {selectedService && (
          <>
            <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="invoiceDate" className="text-xs font-semibold text-gray-500">
                  Invoice Date
                </label>
                <input
                  id="invoiceDate"
                  type="date"
                  className="input-field"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="paymentStatus" className="text-xs font-semibold text-gray-500">
                  Payment Status
                </label>
                <select
                  id="paymentStatus"
                  className="input-field"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="pending">Pending (Unpaid)</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Charges and Totals */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-100 pb-2">
                <Receipt className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Line Items & Billing Charges</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="laborCharge" className="text-xs font-semibold text-gray-500">
                    Labor Charge (₹)
                  </label>
                  <input
                    id="laborCharge"
                    type="number"
                    min="0"
                    step="any"
                    className="input-field"
                    value={laborCharge}
                    onChange={(e) => setLaborCharge(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="partsCharge" className="text-xs font-semibold text-gray-500">
                    Parts Charge (₹)
                  </label>
                  <input
                    id="partsCharge"
                    type="number"
                    min="0"
                    step="any"
                    className="input-field"
                    value={partsCharge}
                    onChange={(e) => setPartsCharge(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-2">
                <label htmlFor="notes" className="text-xs font-semibold text-gray-500">
                  Invoice Notes / Payment Terms (Optional)
                </label>
                <textarea
                  id="notes"
                  rows="2"
                  className="input-field py-2.5"
                  placeholder="e.g. Thank you for your business! Or payment received via GPay"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Dynamic Totals */}
              <div className="bg-primary-50 -mx-4 -mb-4 px-4 py-4 rounded-b-2xl border-t border-primary-100 flex justify-between items-center">
                <span className="font-bold text-primary-900 text-sm">Grand Total (Calculated)</span>
                <span className="font-black text-primary-900 text-xl">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => goBack()}
                className="flex-1 btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? 'Generating...' : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Create Invoice</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
