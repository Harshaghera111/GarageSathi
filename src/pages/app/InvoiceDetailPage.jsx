/**
 * InvoiceDetailPage — GarageSathi
 *
 * Full implementation for invoice details view.
 * Displays garage information, customer profiles, vehicle details,
 * and cost breakdown dynamically fetched from settings and invoices.
 * Supports printing, WhatsApp sharing, and marking as paid.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, MessageCircle, DollarSign, Check, FileText, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getInvoice } from '@/services/invoiceService';
import { getService } from '@/services/serviceService';
import { formatDate, formatPhone, formatVehicleNumber } from '@/utils/formatters';
import { shareInvoiceOnWhatsApp } from '@/utils/whatsapp';
import Loader from '@/components/common/Loader';

export default function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { garageId, garageName, user } = useAuthStore();
  const { updateInvoice } = useInvoiceStore();
  const { settings, fetchSettings } = useSettingsStore();

  const [invoice, setInvoice] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch invoice, settings, and service
  useEffect(() => {
    async function loadInvoiceData() {
      if (!garageId || !id) return;
      try {
        setLoading(true);
        // Load Settings
        await fetchSettings(garageId);
        
        // Load Invoice
        const data = await getInvoice(garageId, id);
        if (!data) {
          toast.error('Invoice not found');
          navigate('/app/billing');
          return;
        }
        setInvoice(data);

        // Fetch associated service if exists to get serviceType
        if (data.serviceId) {
          const serviceData = await getService(garageId, data.serviceId);
          if (serviceData) {
            setService(serviceData);
          }
        }
      } catch (err) {
        console.error('Error loading invoice details:', err);
        toast.error('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    }

    loadInvoiceData();
  }, [garageId, id, navigate, fetchSettings]);

  // Mark invoice as paid
  const handleMarkPaid = async () => {
    if (!garageId || !id || !invoice) return;
    try {
      setUpdating(true);
      await updateInvoice(garageId, id, { paymentStatus: 'paid' });
      setInvoice((prev) => ({ ...prev, paymentStatus: 'paid' }));
      toast.success('Invoice marked as Paid!');
    } catch (err) {
      console.error('Error marking paid:', err);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    if (!invoice) return;
    const phone = invoice.customerInfo?.phone;
    if (!phone) {
      toast.error('Customer phone number not available for WhatsApp');
      return;
    }
    const serviceTypeLabel = service?.serviceType 
      ? (service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1)).replace('_', ' ')
      : 'Regular Service';

    shareInvoiceOnWhatsApp(phone, invoice, serviceTypeLabel);
  };

  if (loading) {
    return <Loader fullPage text="Loading invoice details..." />;
  }

  if (!invoice) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 font-semibold">Invoice could not be loaded.</p>
        <button onClick={() => navigate('/app/billing')} className="btn-secondary mt-4">
          Back to Invoices
        </button>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === 'paid';
  const serviceTypeLabel = service?.serviceType 
    ? (service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1)).replace('_', ' ')
    : 'Regular Service';

  // Dynamic currency symbol formatting
  const curSymbol = settings.currencySymbol || '₹';
  const formatCurrencyCustom = (amount) => {
    if (amount === null || amount === undefined) return `${curSymbol}0`;
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `${curSymbol}${formatted}`;
  };

  // Tax calculations
  const subtotal = invoice.subtotal || invoice.totalAmount || 0;
  const showTax = settings.showTaxOnInvoice;
  const taxRate = settings.defaultTaxPercentage || 0;
  const taxAmount = showTax ? subtotal * (taxRate / 100) : 0;
  const grandTotal = showTax ? subtotal + taxAmount : invoice.totalAmount || subtotal;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Header - Hidden during print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/billing')}
            className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Invoice Details</h1>
            <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-50 active:bg-surface-100 text-gray-600"
            title="Print Invoice"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-50 active:bg-surface-100 text-green-600"
            title="Share via WhatsApp"
          >
            <MessageCircle className="w-5 h-5 fill-green-50" />
          </button>
        </div>
      </div>

      {/* Main Invoice Card (Prints cleanly) */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-6 print:shadow-none print:border-none print:p-0">
        
        {/* Printable top header */}
        <div className="flex justify-between items-start border-b border-surface-150 pb-4">
          <div className="flex gap-3.5 items-start">
            {settings.showLogoOnInvoice && settings.logoUrl && (
              <div className="w-12 h-12 rounded-xl border border-surface-200 overflow-hidden flex items-center justify-center bg-surface-50 flex-shrink-0">
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-black tracking-tight" style={{ color: settings.primaryColor || '#3B82F6' }}>
                {settings.garageName || garageName || 'GarageSathi'}
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal">
                {settings.address 
                  ? `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pinCode}` 
                  : 'Authorized Service Center'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {settings.phone ? `Phone: ${formatPhone(settings.phone)}` : user?.email || ''}
                {settings.email ? ` | Email: ${settings.email}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-gray-900">INVOICE</h3>
            <p className="text-xs font-semibold mt-1" style={{ color: settings.primaryColor || '#3B82F6' }}>
              {invoice.invoiceNumber}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Date: {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : formatDate(invoice.createdAt?.toDate())}
            </p>
          </div>
        </div>

        {/* Client & Vehicle Details Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-600 border-b border-surface-150 pb-4">
          <div className="space-y-1">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-2">Billed To</h4>
            <p className="font-bold text-gray-900 text-sm">{invoice.customerInfo?.name}</p>
            <p>{invoice.customerInfo?.phone ? formatPhone(invoice.customerInfo.phone) : 'No Phone'}</p>
            {invoice.customerInfo?.address && <p>{invoice.customerInfo.address}</p>}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-2">Vehicle Details</h4>
            <p className="font-bold text-gray-900 tracking-wide text-sm">
              {formatVehicleNumber(invoice.vehicleInfo?.vehicleNumber)}
            </p>
            <p>{invoice.vehicleInfo?.vehicleBrand} {invoice.vehicleInfo?.vehicleModel}</p>
            <p>Odometer: {invoice.vehicleInfo?.odometer?.toLocaleString('en-IN') || 0} km</p>
          </div>
        </div>

        {/* Invoice Summary and Itemization */}
        <div className="space-y-3.5">
          <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Service & Charges</h4>
          
          <div className="rounded-xl border border-surface-200 overflow-hidden divide-y divide-surface-200 text-xs">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-surface-50 p-3 font-bold text-gray-700">
              <span className="col-span-2">Description</span>
              <span className="text-right">Amount</span>
            </div>

            {/* Labor row */}
            <div className="grid grid-cols-3 p-3 text-gray-600">
              <span className="col-span-2 font-medium">Labor & Service Charges ({serviceTypeLabel})</span>
              <span className="text-right font-bold text-gray-800">{formatCurrencyCustom(invoice.laborCharge || 0)}</span>
            </div>

            {/* Parts row */}
            <div className="grid grid-cols-3 p-3 text-gray-600">
              <span className="col-span-2 font-medium">Parts & Consumables Charge</span>
              <span className="text-right font-bold text-gray-800">{formatCurrencyCustom(invoice.partsCharge || 0)}</span>
            </div>
          </div>
        </div>

        {/* Totals & Notes Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Notes */}
          <div className="text-xs text-gray-500 space-y-1.5 order-2 sm:order-1">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Notes & Terms</span>
            <p className="leading-relaxed bg-surface-50 p-3 rounded-xl border border-surface-200 italic">
              {invoice.notes || 'Thank you for your business! Please visit us again.'}
            </p>
          </div>

          {/* Totals breakdown */}
          <div className="space-y-2 order-1 sm:order-2 text-xs">
            <div className="flex justify-between font-semibold text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrencyCustom(subtotal)}</span>
            </div>
            
            {showTax && (
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Tax / GST ({taxRate}%)</span>
                <span>{formatCurrencyCustom(taxAmount)}</span>
              </div>
            )}

            <div 
              className="flex justify-between items-center p-3 rounded-xl border font-bold text-sm mt-2"
              style={{ 
                backgroundColor: `${settings.primaryColor || '#3B82F6'}10`, 
                borderColor: `${settings.primaryColor || '#3B82F6'}30`,
                color: settings.primaryColor || '#3B82F6' 
              }}
            >
              <span>Grand Total</span>
              <span className="text-base">{formatCurrencyCustom(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer print note */}
        <div className="hidden print:block text-center pt-8 text-[10px] text-gray-400">
          This is a computer-generated invoice and requires no signature. Powered by GarageSathi.
        </div>
      </div>

      {/* Payment Action Bar - Hidden during print */}
      <div className="mt-6 space-y-3 print:hidden">
        {/* Status indicator banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isPaid 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider">Payment Status</p>
              <p className="font-bold text-sm">{isPaid ? 'Paid & Closed' : 'Pending Payment'}</p>
            </div>
          </div>
          {isPaid && (
            <div className="bg-emerald-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Mark Paid Button */}
        {!isPaid && (
          <button
            onClick={handleMarkPaid}
            disabled={updating}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-emerald-700 shadow-sm"
          >
            <DollarSign className="w-5 h-5" />
            <span>{updating ? 'Updating Status...' : 'Mark as Paid'}</span>
          </button>
        )}

        {/* WhatsApp Sharing Shortcut */}
        <button
          onClick={handleWhatsAppShare}
          className="w-full btn-secondary py-3.5 flex items-center justify-center gap-2 bg-white hover:bg-surface-50 border-surface-200"
        >
          <MessageCircle className="w-5 h-5 text-green-500 fill-green-500" />
          <span>Send Invoice Summary on WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
