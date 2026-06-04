/**
 * Register Page — GarageSathi
 *
 * Garage owner registration form.
 * Collects: personal info + garage info in a simple form.
 * Creates Firebase Auth user + Firestore user + Firestore garage.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Store, MapPin, Wrench, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerGarageOwner, getUserProfile } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { validateEmail, validatePhone, validatePassword, validateRequired } from '@/utils/validators';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    garageName: '',
    garageCity: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  function validateForm() {
    const newErrors = {};
    newErrors.name = validateRequired(formData.name, 'Name');
    newErrors.email = validateEmail(formData.email);
    newErrors.phone = validatePhone(formData.phone);
    newErrors.password = validatePassword(formData.password);
    newErrors.garageName = validateRequired(formData.garageName, 'Garage name');

    // Remove null entries
    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user } = await registerGarageOwner(formData);
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUser(profile);
      }
      toast.success('Welcome to GarageSathi! 🎉');
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Try logging in.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Use at least 6 characters.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo & Brand */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">GarageSathi</h1>
        <p className="text-gray-500 mt-1">Register Your Garage</p>
      </div>

      {/* Registration Form */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section: Your Details */}
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Your Details
          </p>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Rajesh Kumar"
                className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="9876543210"
                className={`input-field pl-10 ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="your@email.com"
                className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="At least 6 characters"
                className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`}
                autoComplete="new-password"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Divider */}
          <div className="border-t border-surface-200 pt-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Garage Details
            </p>
          </div>

          {/* Garage Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Garage Name *
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.garageName}
                onChange={(e) => updateField('garageName', e.target.value)}
                placeholder="Sharma Motors"
                className={`input-field pl-10 ${errors.garageName ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.garageName && <p className="text-red-500 text-xs mt-1">{errors.garageName}</p>}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.garageCity}
                onChange={(e) => updateField('garageCity', e.target.value)}
                placeholder="Jaipur"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Register Garage
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-500 font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
