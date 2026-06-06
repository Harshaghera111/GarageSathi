/**
 * CustomerDetailPage — GarageSathi
 *
 * Full implementation for customer profile and primary vehicle detail view.
 * Displays stats, lists customer service history, and provides quick actions
 * (Call, WhatsApp, Create Service, Edit).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Edit2,
  Phone,
  MessageCircle,
  Plus,
  User,
  Bike,
  Calendar,
  MapPin,
  FileText,
  Gauge,
  Wrench,
  IndianRupee,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import * as customerService from '@/services/customerService';
import * as serviceService from '@/services/serviceService';
import {
  formatPhone,
  formatCurrency,
  formatDate,
  formatVehicleNumber,
} from '@/utils/formatters';
import { openWhatsApp } from '@/utils/whatsapp';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import { SERVICE_STATUS_LABELS, SERVICE_STATUS_COLORS } from '@/config/constants';

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { garageId } = useAuthStore();

  const [customer, setCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  // Fetch customer details and services
  useEffect(() => {
    async function loadData() {
      if (!garageId || !id) return;

      try {
        setLoadingCustomer(true);
        const data = await customerService.getCustomer(garageId, id);
        if (!data) {
          toast.error('Customer not found');
          navigate('/app/customers');
          return;
        }
        setCustomer(data);
      } catch (err) {
        console.error('Error fetching customer:', err);
        toast.error('Failed to load customer profile');
      } finally {
        setLoadingCustomer(false);
      }

      try {
        setLoadingServices(true);
        const serviceList = await serviceService.getCustomerServices(garageId, id);
        setServices(serviceList || []);
      } catch (err) {
        console.error('Error fetching services list:', err);
      } finally {
        setLoadingServices(false);
      }
    }

    loadData();
  }, [garageId, id, navigate]);

  if (loadingCustomer) {
    return <Loader fullPage text="Loading customer details..." />;
  }

  if (!customer) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 font-semibold">Customer data could not be loaded.</p>
        <button onClick={() => navigate('/app/customers')} className="btn-secondary mt-4">
          Back to Customers
        </button>
      </div>
    );
  }

  const mainVehicle = customer.vehicles?.[0] || {};

  // Formatted values
  const formattedPhone = customer.phone ? formatPhone(customer.phone) : 'No phone number';
  const formattedAltPhone = customer.alternatePhone ? formatPhone(customer.alternatePhone) : null;
  const formattedOdo = mainVehicle.odometer
    ? `${mainVehicle.odometer.toLocaleString('en-IN')} km`
    : '0 km';
  const lastServiceDateFormatted = mainVehicle.lastServiceDate
    ? formatDate(mainVehicle.lastServiceDate)
    : 'No record';

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/customers')}
            className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
            aria-label="Back to customers list"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-xs text-gray-500">
              Customer ID: {customer.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        
        {/* Edit Button */}
        <button
          onClick={() => navigate(`/app/customers/${customer.id}/edit`)}
          className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
          title="Edit customer details"
        >
          <Edit2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grid: Stats and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Services */}
        <div className="card bg-primary-50 border-primary-100 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-800">
              {customer.totalServices || 0}
            </p>
            <p className="text-xs text-primary-600 font-medium">Total Services</p>
          </div>
        </div>

        {/* Stat 2: Spent */}
        <div className="card bg-green-50 border-green-100 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(customer.totalSpent || 0)}
            </p>
            <p className="text-xs text-green-600 font-medium">Total Spent</p>
          </div>
        </div>

        {/* Stat 3: Last Service */}
        <div className="card bg-amber-50 border-amber-100 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-800 truncate max-w-[170px]">
              {lastServiceDateFormatted}
            </p>
            <p className="text-xs text-amber-600 font-medium">Last Service Date</p>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Call button */}
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="btn-secondary bg-white py-2.5 flex items-center justify-center gap-2 hover:bg-surface-50 text-gray-800"
          >
            <Phone className="w-5 h-5 text-primary-500" />
            <span>Call</span>
          </a>
        )}

        {/* WhatsApp button */}
        {customer.phone && (
          <button
            onClick={() => openWhatsApp(customer.phone, `Hello ${customer.name}, regarding your vehicle service...`)}
            className="btn-secondary bg-white py-2.5 flex items-center justify-center gap-2 hover:bg-surface-50 text-gray-800"
          >
            <MessageCircle className="w-5 h-5 text-green-500 fill-green-500" />
            <span>WhatsApp</span>
          </button>
        )}

        {/* Edit Button */}
        <button
          onClick={() => navigate(`/app/customers/${customer.id}/edit`)}
          className="btn-secondary bg-white py-2.5 flex items-center justify-center gap-2 hover:bg-surface-50 text-gray-800"
        >
          <Edit2 className="w-5 h-5 text-gray-600" />
          <span>Edit Profile</span>
        </button>

        {/* Create Service */}
        <button
          onClick={() => navigate('/app/services/new', { state: { customerId: customer.id } })}
          className="btn-primary py-2.5 col-span-2 md:col-span-1"
        >
          <Plus className="w-5 h-5" />
          <span>Create Service</span>
        </button>
      </div>

      {/* Main Details Section: Profile & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Profile Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <User className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Customer Profile</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-400 block text-xs">Primary Phone</span>
              <span className="text-gray-900 font-semibold">{formattedPhone}</span>
            </div>

            {formattedAltPhone && (
              <div>
                <span className="text-gray-400 block text-xs">Alternate Phone</span>
                <span className="text-gray-900 font-medium">{formattedAltPhone}</span>
              </div>
            )}

            <div>
              <span className="text-gray-400 block text-xs">Address</span>
              <span className="text-gray-800 flex gap-1.5 items-start mt-0.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{customer.address || 'No address provided'}</span>
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-xs">Notes</span>
              <span className="text-gray-800 flex gap-1.5 items-start mt-0.5">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="italic">{customer.notes || 'No notes added'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Information Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <Bike className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Vehicle Details</h2>
          </div>

          {Object.keys(mainVehicle).length > 0 ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400 block text-xs">Registration Number</span>
                <span className="text-lg font-bold text-gray-900 tracking-wide">
                  {formatVehicleNumber(mainVehicle.vehicleNumber)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Model</span>
                  <span className="text-gray-900 font-semibold">{mainVehicle.model}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Brand</span>
                  <span className="text-gray-900 font-semibold">{mainVehicle.brand}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Current Odometer</span>
                  <span className="text-gray-900 font-medium flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-gray-400" />
                    {formattedOdo}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Last Service Date</span>
                  <span className="text-gray-900 font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {lastServiceDateFormatted}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              No vehicle information found.
            </div>
          )}
        </div>
      </div>

      {/* Service History Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Service History</h2>
          </div>
          <span className="text-xs bg-surface-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {services.length} services
          </span>
        </div>

        {loadingServices ? (
          <Loader text="Loading service history..." />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No services registered yet"
            description="Create a service record to track repair logs and billing"
            actionLabel="New Service"
            onAction={() => navigate('/app/services/new', { state: { customerId: customer.id } })}
          />
        ) : (
          <div className="divide-y divide-surface-100">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/app/services/${service.id}`)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-50 -mx-4 px-4 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">
                      {service.serviceType || 'General Service'}
                    </p>
                    <Badge variant={SERVICE_STATUS_COLORS[service.status] || 'neutral'}>
                      {SERVICE_STATUS_LABELS[service.status] || service.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(service.createdAt)} • Odo: {service.odometer?.toLocaleString('en-IN') || 0} km
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-3">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(service.finalAmount || service.totalAmount || 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 capitalize">
                    {service.paymentStatus || 'pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
