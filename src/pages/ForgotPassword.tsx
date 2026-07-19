import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { resetPassword } from '../lib/auth';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-700 text-gray-900 dark:text-light placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition border-gray-200 dark:border-dark-500 focus:ring-primary-500/40 focus:border-primary-500';

const labelClass = 'block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = toast.loading('Sending reset link...');

    try {
      const { error } = await resetPassword(email);

      if (error) throw new Error(error);

      toast.dismiss(loadingToast);
      setIsSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to send reset password link');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col transition-colors duration-200">
        {/* Header bar with theme toggle */}
        <div className="w-full flex justify-end p-3">
          <ThemeToggle compact />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 pb-6">
        <div className="w-full max-w-md bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-200 dark:border-dark-500 overflow-hidden text-gray-900 dark:text-light">
          <div className="p-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-light mb-2">Check your email</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
            </p>

            <Link
              to="/login"
              className="block w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition text-center"
            >
              Back to Login
            </Link>

            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full mt-3 py-2 text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium transition"
            >
              Try another email
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col transition-colors duration-200">
      {/* Header bar with theme toggle */}
      <div className="w-full flex justify-end p-3">
        <ThemeToggle compact />
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-6">
      <div className="w-full max-w-md bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-200 dark:border-dark-500 overflow-hidden text-gray-900 dark:text-light">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link
              to="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-center flex-1 pr-5 text-gray-900 dark:text-light">
              Forgot Password
            </h1>
          </div>

          <div className="flex justify-center mb-6">
            <img
              src="/images/forgot-password-illustration.svg"
              alt="Forgot Password"
              className="h-40 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/150?text=Forgot+Password';
              }}
            />
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="your@email.com"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition"
            >
              Send Reset Link
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-semibold"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
