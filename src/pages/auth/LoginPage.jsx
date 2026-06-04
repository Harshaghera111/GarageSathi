/**
 * Login Page — GarageSathi
 *
 * Simple login form with email/password.
 * Big inputs, big button, mobile-friendly.
 * Links to register and forgot password.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginWithEmail, getUserProfile } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Where to redirect after login
  const from = location.state?.from?.pathname || '/app/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = await loginWithEmail(email, password);
      const profile = await getUserProfile(firebaseUser.uid);

      if (profile) {
        setUser(profile);
        toast.success('Welcome back! 🙏');
        navigate(from, { replace: true });
      } else {
        toast.error('Account not found. Please register.');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Wrong password. Try again.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please wait and try again.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo & Brand */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">GarageSathi</h1>
        <p className="text-gray-500 mt-1">Smart Garage Management</p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Login to Your Garage
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field pl-10"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field pl-10"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-500 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-gray-500 mt-6">
          New to GarageSathi?{' '}
          <Link to="/register" className="text-primary-500 font-semibold">
            Register your garage
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-8">
        © 2026 GarageSathi. Made for Indian Garages 🇮🇳
      </p>
    </div>
  );
}
