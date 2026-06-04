/**
 * CustomerFormPage — GarageSathi
 *
 * Full implementation for Add / Edit Customer form.
 * Mobile-first, card-based responsive layout with Indian vehicles list,
 * auto-brand filling, and validators integration.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, User, Bike, Calendar, FileText, MapPin, Gauge } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { getCustomer } from '@/services/customerService';
import { POPULAR_VEHICLE_MODELS } from '@/config/constants';
import {
  validatePhone,
  validateVehicleNumber,
  validateRequired,
  validatePositiveNumber,
} from '@/utils/validators';

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { garageId } = useAuthStore();
  const { addCustomer, updateCustomer } = useCustomerStore();

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);

  // Form fields: Customer Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Form fields: Vehicle Info
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [brand, setBrand] = useState('');
  const [odometer, setOdometer] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');

  // Keep existing customer document reference for editing (to preserve other vehicles, history, etc.)
  const [existingCustomer, setExistingCustomer] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch customer details if editing
  useEffect(() => {
    async function loadCustomer() {
      if (!isEditing || !garageId || !id) return;
      try {
        setFetchingData(true);
        const data = await getCustomer(garageId, id);
        if (!data) {
          toast.error('Customer not found');
          navigate('/app/customers');
          return;
        }

        setExistingCustomer(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setAlternatePhone(data.alternatePhone || '');
        setAddress(data.address || '');
        setNotes(data.notes || '');

        // Populate first vehicle if available
        if (data.vehicles && data.vehicles.length > 0) {
          const mainVehicle = data.vehicles[0];
          setVehicleNumber(mainVehicle.vehicleNumber || '');
          setBrand(mainVehicle.brand || '');
          setOdometer(mainVehicle.odometer !== undefined ? String(mainVehicle.odometer) : '');
          
          // Format date for date input (YYYY-MM-DD)
          if (mainVehicle.lastServiceDate) {
            let dateStr = '';
            if (mainVehicle.lastServiceDate.seconds) {
              dateStr = new Date(mainVehicle.lastServiceDate.seconds * 1000).toISOString().split('T')[0];
            } else {
              dateStr = new Date(mainVehicle.lastServiceDate).toISOString().split('T')[0];
            }
            setLastServiceDate(dateStr);
          } else {
            setLastServiceDate('');
          }

          // Check if model is standard
          const isStandardModel = POPULAR_VEHICLE_MODELS.includes(mainVehicle.model);
          if (isStandardModel && mainVehicle.model !== 'Other') {
            setModel(mainVehicle.model);
            setCustomModel('');
          } else {
            setModel('Other');
            setCustomModel(mainVehicle.model || '');
          }
        }
      } catch (err) {
        console.error('Error fetching customer data:', err);
        toast.error('Failed to load customer details');
        navigate('/app/customers');
      } finally {
        setFetchingData(false);
      }
    }

    loadCustomer();
  }, [id, isEditing, garageId, navigate]);

  // Auto-set brand based on selected popular model
  const handleModelChange = (selectedModel) => {
    setModel(selectedModel);
    
    // Clear error
    if (errors.model) {
      setErrors((prev) => ({ ...prev, model: '' }));
    }

    if (selectedModel && selectedModel !== 'Other') {
      // Extract brand as the first word of the model name (e.g. "Honda Activa 6G" -> "Honda")
      const guessedBrand = selectedModel.split(' ')[0];
      setBrand(guessedBrand);
      if (errors.brand) {
        setErrors((prev) => ({ ...prev, brand: '' }));
      }
    } else {
      setBrand('');
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    // Name
    const nameErr = validateRequired(name, 'Full name');
    if (nameErr) newErrors.name = nameErr;

    // Phone
    const phoneErr = validatePhone(phone);
    if (phoneErr) newErrors.phone = phoneErr;

    // Alternate Phone
    if (alternatePhone) {
      const altPhoneErr = validatePhone(alternatePhone);
      if (altPhoneErr) newErrors.alternatePhone = altPhoneErr;
    }

    // Vehicle Number
    const vNumErr = validateVehicleNumber(vehicleNumber);
    if (vNumErr) newErrors.vehicleNumber = vNumErr;

    // Model
    const selectedModelValue = model === 'Other' ? customModel : model;
    const modelErr = validateRequired(selectedModelValue, 'Vehicle model');
    if (modelErr) newErrors.model = modelErr;

    // Brand
    const brandErr = validateRequired(brand, 'Brand');
    if (brandErr) newErrors.brand = brandErr;

    // Odometer
    if (odometer) {
      const odoErr = validatePositiveNumber(odometer, 'Odometer reading');
      if (odoErr) newErrors.odometer = odoErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      const finalModel = model === 'Other' ? customModel.trim() : model;

      // Construct vehicle details object
      const mainVehicle = {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        model: finalModel.trim(),
        brand: brand.trim(),
        odometer: odometer ? parseInt(odometer, 10) : 0,
        lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
      };

      if (isEditing) {
        // Preserving other vehicles if they exist
        const otherVehicles = existingCustomer?.vehicles?.slice(1) || [];
        const customerUpdates = {
          name: name.trim(),
          phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || '',
          address: address.trim() || '',
          notes: notes.trim() || '',
          vehicles: [mainVehicle, ...otherVehicles],
        };

        await updateCustomer(garageId, id, customerUpdates);
        toast.success('Customer updated successfully!');
        navigate(`/app/customers/${id}`);
      } else {
        const customerData = {
          name: name.trim(),
          phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || '',
          address: address.trim() || '',
          notes: notes.trim() || '',
          vehicles: [mainVehicle],
        };

        const newId = await addCustomer(garageId, customerData);
        toast.success('Customer created successfully!');
        navigate(`/app/customers/${newId}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(isEditing ? 'Failed to update customer' : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Fetching customer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
          aria-label="Go back"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Customer' : 'Add Customer'}
          </h1>
          <p className="text-xs text-gray-500">
            {isEditing ? 'Modify profile and primary vehicle details' : 'Register a new customer and vehicle'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Profile */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <User className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Customer Profile</h2>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-1 block">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g. Rajesh Kumar"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              disabled={loading}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Phone Numbers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1 block">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 font-medium text-base select-none">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  className={`input-field pl-12 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Alternate Phone */}
            <div>
              <label htmlFor="alternatePhone" className="text-sm font-medium text-gray-700 mb-1 block">
                Alternate Mobile (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 font-medium text-base select-none">
                  +91
                </span>
                <input
                  id="alternatePhone"
                  type="tel"
                  className={`input-field pl-12 ${errors.alternatePhone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="98765 43210"
                  value={alternatePhone}
                  onChange={(e) => {
                    setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (errors.alternatePhone) setErrors((prev) => ({ ...prev, alternatePhone: '' }));
                  }}
                  disabled={loading}
                />
              </div>
              {errors.alternatePhone && (
                <p className="text-xs text-red-500 mt-1">{errors.alternatePhone}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1 block">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <textarea
                id="address"
                className="input-field pl-10 h-20 resize-none py-2"
                placeholder="e.g. Sector 15, Dwarka, New Delhi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1 block">
              Customer Notes / Requests
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <textarea
                id="notes"
                className="input-field pl-10 h-20 resize-none py-2"
                placeholder="e.g. Prefers Sunday service, requests synthetic oil only"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle Details */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <Bike className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Vehicle Information</h2>
          </div>

          {/* Vehicle Number */}
          <div>
            <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700 mb-1 block">
              Vehicle Registration Number *
            </label>
            <input
              id="vehicleNumber"
              type="text"
              className={`input-field uppercase ${errors.vehicleNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g. DL03CAB1234"
              value={vehicleNumber}
              onChange={(e) => {
                setVehicleNumber(e.target.value.replace(/\s/g, '').toUpperCase());
                if (errors.vehicleNumber) setErrors((prev) => ({ ...prev, vehicleNumber: '' }));
              }}
              disabled={loading}
            />
            {errors.vehicleNumber && <p className="text-xs text-red-500 mt-1">{errors.vehicleNumber}</p>}
          </div>

          {/* Model and Brand Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model Selection */}
            <div>
              <label htmlFor="model" className="text-sm font-medium text-gray-700 mb-1 block">
                Vehicle Model *
              </label>
              <select
                id="model"
                className={`input-field ${errors.model ? 'border-red-500 focus:border-red-500' : ''}`}
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Model --</option>
                {POPULAR_VEHICLE_MODELS.filter(m => m !== 'Other').map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="Other">Other (Type custom model)</option>
              </select>
              {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="text-sm font-medium text-gray-700 mb-1 block">
                Brand *
              </label>
              <input
                id="brand"
                type="text"
                className={`input-field ${errors.brand ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. Honda, Bajaj, Royal Enfield"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  if (errors.brand) setErrors((prev) => ({ ...prev, brand: '' }));
                }}
                disabled={loading}
              />
              {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
            </div>
          </div>

          {/* Custom Model Text Field (only if Other selected) */}
          {model === 'Other' && (
            <div>
              <label htmlFor="customModel" className="text-sm font-medium text-gray-700 mb-1 block">
                Custom Vehicle Model Name *
              </label>
              <input
                id="customModel"
                type="text"
                className={`input-field ${errors.model ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. Suzuki Access 125"
                value={customModel}
                onChange={(e) => {
                  setCustomModel(e.target.value);
                  if (errors.model) setErrors((prev) => ({ ...prev, model: '' }));
                }}
                disabled={loading}
              />
            </div>
          )}

          {/* Odometer and Last Service Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Odometer */}
            <div>
              <label htmlFor="odometer" className="text-sm font-medium text-gray-700 mb-1 block">
                Current Odometer (km)
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="odometer"
                  type="number"
                  className={`input-field pl-10 ${errors.odometer ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g. 12450"
                  value={odometer}
                  onChange={(e) => {
                    setOdometer(e.target.value);
                    if (errors.odometer) setErrors((prev) => ({ ...prev, odometer: '' }));
                  }}
                  disabled={loading}
                  min="0"
                />
              </div>
              {errors.odometer && <p className="text-xs text-red-500 mt-1">{errors.odometer}</p>}
            </div>

            {/* Last Service Date */}
            <div>
              <label htmlFor="lastServiceDate" className="text-sm font-medium text-gray-700 mb-1 block">
                Last Service Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="lastServiceDate"
                  type="date"
                  className="input-field pl-10"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]} // Cannot be in future
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Register Customer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
