/**
 * Forgot Password Page — GarageSathi
 *
 * Simple password reset form.
 * Sends reset email via Firebase Auth.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      console.error('Reset error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else {
        toast.error('Failed to send reset email. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="text-gray-500 mt-1">
          {sent
            ? 'Check your email for the reset link'
            : "Enter your email and we'll send a reset link"
          }
        </p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        {sent ? (
          /* Success State */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-700 mb-6">
              We sent a reset link to <strong>{email}</strong>.
              Check your inbox and follow the link.
            </p>
            <Link to="/login" className="btn-primary w-full inline-flex">
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </Link>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 mt-6">
          <Link to="/login" className="text-primary-500 font-medium flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
