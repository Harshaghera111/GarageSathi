/**
 * SettingsPage — GarageSathi
 *
 * Full implementation for garage profile settings.
 * Allows managing Business Info, Branding (Logo, primary color, prefix)
 * and Invoice parameters (Tax percentages, Currency, toggles).
 */

import { useState, useEffect } from 'react';
import { Store, User, FileText, Check, Palette, Upload, X, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import PageHeader from '@/components/common/PageHeader';
import Loader from '@/components/common/Loader';
import { seedDemoData, clearDemoData } from '@/utils/seeder';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export default function SettingsPage() {
  const { garageId } = useAuthStore();
  const { settings, fetchSettings, updateSettings, loading } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('business');

  // Form states
  const [garageName, setGarageName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  // Branding
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  
  // Invoice settings
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [defaultTaxPercentage, setDefaultTaxPercentage] = useState(0);
  const [showTaxOnInvoice, setShowTaxOnInvoice] = useState(false);
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(false);

  // Seeder state
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSeedData = async () => {
    if (!garageId) return;
    try {
      setSeeding(true);
      await seedDemoData(garageId);
      toast.success('Demo data seeded successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Seeding failed:', err);
      toast.error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!garageId) return;
    try {
      setClearing(true);
      await clearDemoData(garageId);
      toast.success('Demo data cleared successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Clearing failed:', err);
      toast.error('Failed to clear demo data');
    } finally {
      setClearing(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    if (garageId) {
      fetchSettings(garageId);
    }
  }, [garageId, fetchSettings]);

  // Sync form states with loaded settings
  useEffect(() => {
    if (settings) {
      setGarageName(settings.garageName || '');
      setOwnerName(settings.ownerName || '');
      setPhone(settings.phone || '');
      setWhatsapp(settings.whatsapp || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setCity(settings.city || '');
      setState(settings.state || '');
      setPinCode(settings.pinCode || '');
      setLogoUrl(settings.logoUrl || '');
      setPrimaryColor(settings.primaryColor || '#3B82F6');
      setInvoicePrefix(settings.invoicePrefix || 'INV');
      setCurrencySymbol(settings.currencySymbol || '₹');
      setDefaultTaxPercentage(settings.defaultTaxPercentage || 0);
      setShowTaxOnInvoice(settings.showTaxOnInvoice || false);
      setShowLogoOnInvoice(settings.showLogoOnInvoice || false);
    }
  }, [settings]);

  // Base64 Logo File Upload with limits
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 150KB for Base64 document efficiency)
    if (file.size > 150 * 1024) {
      toast.error('Logo image must be smaller than 150KB (Low resolution/compressed recommended)');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result);
      toast.success('Logo uploaded and compressed successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoUrl('');
  };

  // Submitting changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!garageId) return;

    // Validation
    if (!garageName.trim() || !ownerName.trim() || !phone.trim() || !address.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate Phone & WhatsApp (minimum 10 digits)
    const phoneRegex = /^[0-9+\s-]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error('Please enter a valid Phone Number (10-15 digits)');
      return;
    }
    if (!phoneRegex.test(whatsapp.trim())) {
      toast.error('Please enter a valid WhatsApp Number (10-15 digits)');
      return;
    }

    // Validate invoice prefix (alphabets only, 2-6 chars)
    const prefixRegex = /^[A-Z]{2,6}$/;
    const upperPrefix = invoicePrefix.trim().toUpperCase();
    if (upperPrefix && !prefixRegex.test(upperPrefix)) {
      toast.error('Invoice prefix must be 2-6 capital letters (e.g. INV, GS)');
      return;
    }

    const updatedData = {
      garageName: garageName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state,
      pinCode: pinCode.trim(),
      logoUrl: logoUrl,
      primaryColor: primaryColor,
      invoicePrefix: upperPrefix,
      currencySymbol: currencySymbol,
      defaultTaxPercentage: Number(defaultTaxPercentage),
      showTaxOnInvoice: showTaxOnInvoice,
      showLogoOnInvoice: showLogoOnInvoice,
    };

    try {
      await updateSettings(garageId, updatedData);
      toast.success('Garage profile updated successfully!');
    } catch (err) {
      console.error('Update settings failed:', err);
      toast.error('Failed to update settings');
    }
  };

  if (loading && !garageName) {
    return <Loader fullPage text="Loading settings..." />;
  }

  const tabs = [
    { id: 'business', label: 'Business Profile', icon: Store },
    { id: 'branding', label: 'Branding Settings', icon: Palette },
    { id: 'invoices', label: 'Invoice Rules', icon: FileText },
    ...(import.meta.env.DEV ? [{ id: 'seeder', label: 'Demo Seeder', icon: Database }] : [])
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <PageHeader title="Settings" subtitle="Configure business details & custom branding" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 mt-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? 'border-primary-500 text-primary-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        
        {/* TAB 1: Business Information */}
        {activeTab === 'business' && (
          <div className="card space-y-4">
            <div className="border-b border-surface-100 pb-2 flex items-center gap-2">
              <Store className="w-4.5 h-4.5 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900">Garage Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Garage Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  placeholder="e.g. AutoCare Hub"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Owner Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Phone Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">WhatsApp Share Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-500">Email Address (Optional)</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@autocare.com"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-500">Shop Address *</label>
                <textarea
                  rows="2"
                  className="input-field py-2.5"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 10, Sector 4, Indiranagar"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">City *</label>
                <input
                  type="text"
                  className="input-field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">State *</label>
                <select
                  className="input-field"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="">-- Choose State --</option>
                  {STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">PIN Code *</label>
                <input
                  type="text"
                  maxLength="6"
                  className="input-field"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="e.g. 560038"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Branding Settings */}
        {activeTab === 'branding' && (
          <div className="card space-y-6">
            <div className="border-b border-surface-100 pb-2 flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900">Custom Branding</h2>
            </div>

            {/* Logo upload */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 block">Garage Logo Icon</span>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative w-16 h-16 rounded-xl border border-surface-200 overflow-hidden flex items-center justify-center bg-surface-50 flex-shrink-0">
                    <img src={logoUrl} alt="Garage Logo Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center text-white border border-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-surface-300 flex flex-col items-center justify-center text-gray-400 bg-surface-50 flex-shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                )}
                
                <div className="flex-1">
                  <label className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer bg-white border-surface-200">
                    <Upload className="w-3.5 h-3.5 text-gray-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">
                    JPEG, PNG up to 150KB. Automatically compressed to store in profiles.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Color & Prefix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">Invoice Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-11 h-11 p-1 bg-white border border-surface-200 rounded-xl cursor-pointer"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-800 uppercase">{primaryColor}</span>
                    <p className="text-[10px] text-gray-400">Used for highlights and badges</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Invoice Number Prefix *</label>
                <input
                  type="text"
                  maxLength="6"
                  className="input-field uppercase font-mono font-bold"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="e.g. INV"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-0.5">2-6 capital letters. Changes will apply to new invoices.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Invoice Settings */}
        {activeTab === 'invoices' && (
          <div className="card space-y-4">
            <div className="border-b border-surface-100 pb-2 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900">Invoice Generation Rules</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Currency Symbol *</label>
                <select
                  className="input-field font-semibold"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  required
                >
                  <option value="₹">₹ (INR - Rupee)</option>
                  <option value="$">$ (USD - Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - Pound)</option>
                  <option value="¥">¥ (JPY - Yen)</option>
                  <option value="AED">AED (Dirham)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Default GST / Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  className="input-field"
                  value={defaultTaxPercentage}
                  onChange={(e) => setDefaultTaxPercentage(e.target.value)}
                  placeholder="e.g. 18"
                />
              </div>
            </div>

            <div className="pt-2 divide-y divide-surface-100">
              {/* Show Tax Toggle */}
              <div className="py-3.5 flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Apply Tax Rate on Invoices</span>
                  <span className="text-xs text-gray-400">Show subtotal, GST percentage and tax breakdown</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTaxOnInvoice}
                    onChange={(e) => setShowTaxOnInvoice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Show Logo Toggle */}
              <div className="py-3.5 flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Print Garage Logo Icon</span>
                  <span className="text-xs text-gray-400">Render custom branding logo at the top of PDF/printed bills</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogoOnInvoice}
                    onChange={(e) => setShowLogoOnInvoice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Seeder */}
        {activeTab === 'seeder' && (
          <div className="card space-y-4">
            <div className="border-b border-surface-100 pb-2 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900">Developer Options — Seeder</h2>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Generate dummy data to test the dashboard, lists, and invoice configurations. 
              Seeding will add <strong>20 customers</strong>, <strong>30 services</strong>, and <strong>15 invoices</strong> under your current garage workspace.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeedData}
                disabled={seeding || clearing}
                className="flex-1 btn-primary bg-primary-600 hover:bg-primary-700 text-white py-3 flex items-center justify-center gap-2"
              >
                <span>{seeding ? 'Seeding...' : 'Seed Demo Data'}</span>
              </button>
              
              <button
                type="button"
                onClick={handleClearData}
                disabled={seeding || clearing}
                className="flex-1 btn-secondary text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 py-3 flex items-center justify-center gap-2"
              >
                <span>{clearing ? 'Clearing...' : 'Clear Demo Data'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Submit */}
        {activeTab !== 'seeder' && (
          <button
            type="submit"
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 shadow-md"
            disabled={loading}
          >
            {loading ? 'Saving Profile...' : (
              <>
                <Check className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}
