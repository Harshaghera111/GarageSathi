/**
 * ServiceFormPage — GarageSathi
 *
 * Full implementation for Add / Edit Service Record form.
 * Includes customer search selection, vehicle loading, cost structure,
 * status dropdown, and navigation context retrieval.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Bike,
  Wrench,
  Search,
  Gauge,
  FileText,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useServiceStore } from '@/stores/serviceStore';
import { getService } from '@/services/serviceService';
import { getCustomer, searchCustomers } from '@/services/customerService';
import { SERVICE_TYPE_LABELS } from '@/config/constants';
import { validateRequired, validatePositiveNumber } from '@/utils/validators';

export default function ServiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id);
  // goBack: falls back to /app/services when opened in a fresh tab
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/app/services'));
  const { garageId } = useAuthStore();
  const { createService, updateService } = useServiceStore();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);

  // Customer selection state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Vehicle selection state
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState('');
  const [vehiclesList, setVehiclesList] = useState([]);

  // Service form fields
  const [serviceType, setServiceType] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [assignedMechanic, setAssignedMechanic] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [laborCharge, setLaborCharge] = useState('0');
  const [partsCharge, setPartsCharge] = useState('0');
  const [status, setStatus] = useState('received');
  const [odometer, setOdometer] = useState('');

  // Keep details for edit mode
  // Removed existingService state since it's unused

  // Validation errors
  const [errors, setErrors] = useState({});

  // Debouncing timeout reference for customer search
  const searchTimeoutRef = useRef(null);

  // Select customer from suggestion list
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setVehiclesList(customer.vehicles || []);
    setCustomerSearch('');
    setCustomerSuggestions([]);
    
    // Automatically select the first vehicle if available
    if (customer.vehicles && customer.vehicles.length > 0) {
      setSelectedVehicleIndex('0');
      setOdometer(customer.vehicles[0].odometer !== undefined ? String(customer.vehicles[0].odometer) : '');
    } else {
      setSelectedVehicleIndex('');
      setOdometer('');
    }

    if (errors.customer) {
      setErrors((prev) => ({ ...prev, customer: '' }));
    }
  };

  // Fetch preselected customer if passed in routing state (e.g. from CustomerDetailPage)
  useEffect(() => {
    async function loadPreselectedCustomer() {
      const preselectedId = location.state?.customerId;
      if (!preselectedId || isEditing || !garageId) return;

      try {
        setFetchingData(true);
        const data = await getCustomer(garageId, preselectedId);
        if (data) {
          handleSelectCustomer(data);
        }
      } catch (err) {
        console.error('Error fetching preselected customer:', err);
      } finally {
        setFetchingData(false);
      }
    }

    loadPreselectedCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, isEditing, garageId]);

  // Load service details if editing
  useEffect(() => {
    async function loadService() {
      if (!isEditing || !garageId || !id) return;

      try {
        setFetchingData(true);
        const serviceData = await getService(garageId, id);
        if (!serviceData) {
          toast.error('Service record not found');
          navigate('/app/services');
          return;
        }

        setServiceType(serviceData.serviceType || '');
        setProblemDescription(serviceData.problemDescription || '');
        setWorkNotes(serviceData.workNotes || '');
        setAssignedMechanic(serviceData.assignedMechanic || '');
        setEstimatedCost(serviceData.estimatedCost !== undefined ? String(serviceData.estimatedCost) : '');
        setLaborCharge(serviceData.laborCharge !== undefined ? String(serviceData.laborCharge) : '0');
        setPartsCharge(serviceData.partsCharge !== undefined ? String(serviceData.partsCharge) : '0');
        setStatus(serviceData.status || 'received');
        setOdometer(serviceData.odometer !== undefined ? String(serviceData.odometer) : '');

        // Fetch associated customer details
        if (serviceData.customerId) {
          const custData = await getCustomer(garageId, serviceData.customerId);
          if (custData) {
            setSelectedCustomer(custData);
            setVehiclesList(custData.vehicles || []);
            
            // Match correct vehicle index
            const matchedIndex = (custData.vehicles || []).findIndex(
              (v) => v.vehicleNumber === serviceData.vehicleNumber
            );
            if (matchedIndex !== -1) {
              setSelectedVehicleIndex(String(matchedIndex));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching service:', err);
        toast.error('Failed to load service details');
        navigate('/app/services');
      } finally {
        setFetchingData(false);
      }
    }

    loadService();
  }, [id, isEditing, garageId, navigate]);

  // Clean up search debouncer
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Handle Customer Search Typing
  const handleCustomerSearchChange = (e) => {
    const val = e.target.value;
    setCustomerSearch(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setCustomerSuggestions([]);
      return;
    }

    setSearchingCustomer(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (garageId) {
          const results = await searchCustomers(garageId, val);
          setCustomerSuggestions(results || []);
        }
      } catch (err) {
        console.error('Search customers error:', err);
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);
  };



  // Handle vehicle dropdown change
  const handleVehicleChange = (indexVal) => {
    setSelectedVehicleIndex(indexVal);
    
    if (indexVal !== '') {
      const vehicle = vehiclesList[parseInt(indexVal, 10)];
      setOdometer(vehicle.odometer !== undefined ? String(vehicle.odometer) : '');
    } else {
      setOdometer('');
    }

    if (errors.vehicle) {
      setErrors((prev) => ({ ...prev, vehicle: '' }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    if (!selectedCustomer) {
      newErrors.customer = 'Please select a customer';
    }

    if (selectedVehicleIndex === '') {
      newErrors.vehicle = 'Please select a vehicle';
    }

    const typeErr = validateRequired(serviceType, 'Service type');
    if (typeErr) newErrors.serviceType = typeErr;

    const descErr = validateRequired(problemDescription, 'Problem description');
    if (descErr) newErrors.problemDescription = descErr;

    if (estimatedCost) {
      const estErr = validatePositiveNumber(estimatedCost, 'Estimated cost');
      if (estErr) newErrors.estimatedCost = estErr;
    }

    if (laborCharge) {
      const laborErr = validatePositiveNumber(laborCharge, 'Labor charge');
      if (laborErr) newErrors.laborCharge = laborErr;
    }

    if (partsCharge) {
      const partsErr = validatePositiveNumber(partsCharge, 'Parts charge');
      if (partsErr) newErrors.partsCharge = partsErr;
    }

    if (odometer) {
      const odoErr = validatePositiveNumber(odometer, 'Odometer reading');
      if (odoErr) newErrors.odometer = odoErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      const vehicleIndex = parseInt(selectedVehicleIndex, 10);
      const vehicle = vehiclesList[vehicleIndex];

      const serviceData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleModel: vehicle.model,
        vehicleBrand: vehicle.brand,
        serviceType,
        problemDescription: problemDescription.trim(),
        workNotes: workNotes.trim(),
        assignedMechanic: assignedMechanic.trim(),
        status,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
        laborCharge: laborCharge ? parseFloat(laborCharge) : 0,
        partsCharge: partsCharge ? parseFloat(partsCharge) : 0,
        odometer: odometer ? parseInt(odometer, 10) : 0,
      };

      if (isEditing) {
        await updateService(garageId, id, serviceData);
        toast.success('Service record updated!');
        navigate(`/app/services/${id}`);
      } else {
        const newId = await createService(garageId, serviceData);
        toast.success('Service record created!');
        navigate(`/app/services/${newId}`);
      }
    } catch (err) {
      console.error('Submit service error:', err);
      toast.error(isEditing ? 'Failed to update service' : 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
            onClick={() => goBack()}
          className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center active:bg-surface-100 transition-colors"
          aria-label="Go back"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Service Job' : 'Create Service Job'}
          </h1>
          <p className="text-xs text-gray-500">
            {isEditing ? 'Update status, costings, and work records' : 'Set up a new service job and diagnostic entry'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Customer Selection */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <User className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Customer Details</h2>
          </div>

          {selectedCustomer ? (
            // Customer Selected Display Card
            <div className="flex items-center justify-between p-3.5 bg-surface-50 border border-surface-200 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">{selectedCustomer.name}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setVehiclesList([]);
                    setSelectedVehicleIndex('');
                  }}
                  className="text-sm text-red-500 hover:text-red-700 font-medium py-1 px-3 border border-red-200 rounded-lg bg-white active:bg-red-50"
                  disabled={loading}
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            // Search Input Mode
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Search Customer (by Name or Phone) *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar or 98765..."
                  className={`input-field pl-10 ${errors.customer ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  disabled={loading}
                />
              </div>

              {errors.customer && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.customer}
                </p>
              )}

              {/* Suggestions box */}
              {customerSearch.trim() && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-surface-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10 divide-y divide-surface-100">
                  {searchingCustomer ? (
                    <p className="p-3.5 text-sm text-gray-400 text-center">Searching customers...</p>
                  ) : customerSuggestions.length === 0 ? (
                    <p className="p-3.5 text-sm text-gray-400 text-center">No customers found</p>
                  ) : (
                    customerSuggestions.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-3.5 text-sm text-gray-700 hover:bg-surface-50 cursor-pointer flex justify-between font-medium"
                      >
                        <span>{cust.name}</span>
                        <span className="text-gray-400">{cust.phone}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vehicle Dropdown */}
          {selectedCustomer && (
            <div>
              <label htmlFor="vehicle" className="text-sm font-medium text-gray-700 mb-1 block">
                Select Vehicle *
              </label>
              <div className="relative">
                <Bike className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <select
                  id="vehicle"
                  className={`input-field pl-10 ${errors.vehicle ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={selectedVehicleIndex}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  disabled={loading || isEditing}
                >
                  <option value="">-- Choose Customer Vehicle --</option>
                  {vehiclesList.map((v, i) => (
                    <option key={v.vehicleNumber} value={i}>
                      {v.vehicleNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>
              {errors.vehicle && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.vehicle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Service Details */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <Wrench className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Service Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Type */}
            <div>
              <label htmlFor="serviceType" className="text-sm font-medium text-gray-700 mb-1 block">
                Service Type *
              </label>
              <select
                id="serviceType"
                className={`input-field ${errors.serviceType ? 'border-red-500' : ''}`}
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  if (errors.serviceType) setErrors((prev) => ({ ...prev, serviceType: '' }));
                }}
                disabled={loading}
              >
                <option value="">-- Choose Type --</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.serviceType && <p className="text-xs text-red-500 mt-1">{errors.serviceType}</p>}
            </div>

            {/* Odometer */}
            <div>
              <label htmlFor="odometer" className="text-sm font-medium text-gray-700 mb-1 block">
                Current Odometer Reading (km)
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="odometer"
                  type="number"
                  placeholder="e.g. 15600"
                  className={`input-field pl-10 ${errors.odometer ? 'border-red-500' : ''}`}
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
          </div>

          {/* Problem Description */}
          <div>
            <label htmlFor="problem" className="text-sm font-medium text-gray-700 mb-1 block">
              Problem Description / Complaints *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                id="problem"
                placeholder="e.g. Engine oil leakage, chain loose, brake pad replacement"
                className={`input-field pl-10 h-20 resize-none py-2.5 ${errors.problemDescription ? 'border-red-500' : ''}`}
                value={problemDescription}
                onChange={(e) => {
                  setProblemDescription(e.target.value);
                  if (errors.problemDescription) setErrors((prev) => ({ ...prev, problemDescription: '' }));
                }}
                disabled={loading}
              />
            </div>
            {errors.problemDescription && (
              <p className="text-xs text-red-500 mt-1">{errors.problemDescription}</p>
            )}
          </div>

          {/* Work Notes */}
          <div>
            <label htmlFor="workNotes" className="text-sm font-medium text-gray-700 mb-1 block">
              Mechanic Work Notes
            </label>
            <textarea
              id="workNotes"
              placeholder="e.g. Cleaned air filter, tightened chain, replaced engine oil filter"
              className="input-field h-20 resize-none py-2.5"
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Assigned Mechanic */}
          <div>
            <label htmlFor="mechanic" className="text-sm font-medium text-gray-700 mb-1 block">
              Assigned Mechanic Name
            </label>
            <input
              id="mechanic"
              type="text"
              placeholder="e.g. Ramesh Singh"
              className="input-field"
              value={assignedMechanic}
              onChange={(e) => setAssignedMechanic(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Card 3: Costs and Status */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-100 pb-3">
            <IndianRupee className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Costs & Status</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Estimated Cost */}
            <div>
              <label htmlFor="estCost" className="text-sm font-medium text-gray-700 mb-1 block">
                Estimated Cost (₹)
              </label>
              <input
                id="estCost"
                type="number"
                placeholder="e.g. 1500"
                className={`input-field ${errors.estimatedCost ? 'border-red-500' : ''}`}
                value={estimatedCost}
                onChange={(e) => {
                  setEstimatedCost(e.target.value);
                  if (errors.estimatedCost) setErrors((prev) => ({ ...prev, estimatedCost: '' }));
                }}
                disabled={loading}
                min="0"
              />
              {errors.estimatedCost && <p className="text-xs text-red-500 mt-1">{errors.estimatedCost}</p>}
            </div>

            {/* Labor Charge */}
            <div>
              <label htmlFor="labor" className="text-sm font-medium text-gray-700 mb-1 block">
                Labor Charge (₹)
              </label>
              <input
                id="labor"
                type="number"
                placeholder="e.g. 350"
                className={`input-field ${errors.laborCharge ? 'border-red-500' : ''}`}
                value={laborCharge}
                onChange={(e) => {
                  setLaborCharge(e.target.value);
                  if (errors.laborCharge) setErrors((prev) => ({ ...prev, laborCharge: '' }));
                }}
                disabled={loading}
                min="0"
              />
              {errors.laborCharge && <p className="text-xs text-red-500 mt-1">{errors.laborCharge}</p>}
            </div>

            {/* Parts Charge */}
            <div>
              <label htmlFor="parts" className="text-sm font-medium text-gray-700 mb-1 block">
                Parts Charge (₹)
              </label>
              <input
                id="parts"
                type="number"
                placeholder="e.g. 800"
                className={`input-field ${errors.partsCharge ? 'border-red-500' : ''}`}
                value={partsCharge}
                onChange={(e) => {
                  setPartsCharge(e.target.value);
                  if (errors.partsCharge) setErrors((prev) => ({ ...prev, partsCharge: '' }));
                }}
                disabled={loading}
                min="0"
              />
              {errors.partsCharge && <p className="text-xs text-red-500 mt-1">{errors.partsCharge}</p>}
            </div>
          </div>

          {/* Job Status Selection */}
          <div>
            <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1 block">
              Job Status
            </label>
            <select
              id="status"
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="received">Received</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_parts">Waiting Parts</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
              onClick={() => goBack()}
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
              'Create Job'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
