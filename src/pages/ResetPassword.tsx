import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { updatePassword } from '../lib/auth';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-700 text-gray-900 dark:text-light placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition border-gray-200 dark:border-dark-500 focus:ring-primary-500/40 focus:border-primary-500';

const labelClass = 'block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkRecoveryToken = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error('Invalid or expired password reset link');
        navigate('/login');
      }
    };

    checkRecoveryToken();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const loadingToast = toast.loading('Resetting password...');

    try {
      const { error } = await updatePassword(newPassword);

      if (error) throw new Error(error);

      toast.dismiss(loadingToast);
      setIsSuccess(true);
      toast.success('Password has been reset successfully');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
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
              <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-light mb-2">Password Reset Successful</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>

            <Link
              to="/login"
              className="block w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition text-center"
            >
              Go to Login
            </Link>
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
              Reset Password
            </h1>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-full">
              <Lock className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Create a new password for your account
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-light transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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
