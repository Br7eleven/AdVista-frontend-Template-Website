import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import CountryCodeSelect from '../components/CountryCodeSelect';
import ThemeToggle from '../components/ThemeToggle';
import { signInWithEmail, signInWithPhone, verifyOtp, signInWithGoogle, resendConfirmationEmail } from '../lib/auth';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-700 text-gray-900 dark:text-light placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition';

const inputNormalClass =
  'border-gray-200 dark:border-dark-500 focus:ring-primary-500/40 focus:border-primary-500';

const inputErrorClass =
  'border-red-500 dark:border-red-400 focus:ring-red-500/40 focus:border-red-500';

const labelClass = 'block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5';

export default function Login() {
  const navigate = useNavigate();
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState('');

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => {
      if (!prev[field] && !authError) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setAuthError('');
  };

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setAuthError('');
      toast.error(
        nextErrors.email && nextErrors.password
          ? 'Please enter your email and password'
          : nextErrors.email || nextErrors.password || 'Please check the form'
      );
      return;
    }

    setFieldErrors({});
    setAuthError('');
    const loadingToast = toast.loading('Signing in...');

    try {
      const { error } = await signInWithEmail(email, password);

      if (error) {
        throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
      }

      toast.dismiss(loadingToast);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.dismiss(loadingToast);

      let errorMessage = 'Failed to log in';
      let highlightFields = false;

      if (error.message && error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        highlightFields = true;
      } else if (error.message && error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address. Check your inbox for the confirmation link.';
        setShowResendConfirmation(true);
        setFieldErrors({ email: 'Email not confirmed' });
      } else if (error.message) {
        errorMessage = error.message;
        highlightFields = true;
      } else if (typeof error === 'object') {
        errorMessage = JSON.stringify(error);
        highlightFields = true;
      } else if (error.toString) {
        errorMessage = error.toString();
        highlightFields = true;
      }

      if (highlightFields) {
        setFieldErrors({
          email: ' ',
          password: ' ',
        });
      }
      setAuthError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handlePhoneLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    
    if (showOtpInput && !otp) {
      toast.error('Please enter the OTP code');
      return;
    }
    
    const fullPhoneNumber = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    
    if (!showOtpInput) {
      const loadingToast = toast.loading('Sending OTP...');
      
      try {
        const { error } = await signInWithPhone(fullPhoneNumber);

        if (error) throw new Error(error);
        
        toast.dismiss(loadingToast);
        setShowOtpInput(true);
        toast.success('OTP sent to your phone!');
      } catch (error: any) {
        toast.dismiss(loadingToast);
        toast.error(error.message || 'Failed to send OTP');
      }
    } else {
      const loadingToast = toast.loading('Verifying OTP...');
      
      try {
        const { error } = await verifyOtp(fullPhoneNumber, otp);

        if (error) throw new Error(error);
        
        toast.dismiss(loadingToast);
        toast.success('Logged in successfully!');
        navigate('/');
      } catch (error: any) {
        toast.dismiss(loadingToast);
        toast.error(error.message || 'Invalid OTP');
      }
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    const loadingToast = toast.loading('Resending confirmation email...');

    try {
      const { error } = await resendConfirmationEmail(email);

      if (error) throw new Error(error);

      toast.dismiss(loadingToast);
      toast.success('Confirmation email sent! Please check your inbox.');
      setShowResendConfirmation(false);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to resend confirmation email');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col transition-colors duration-200">
      {/* Header bar with theme toggle — never overlaps form */}
      <div className="w-full flex justify-end p-3">
        <ThemeToggle compact />
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-6">
      <div className="w-full max-w-md bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-200 dark:border-dark-500 overflow-hidden text-gray-900 dark:text-light">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-center flex-1 pr-5 text-gray-900 dark:text-light">
              Login to your account
            </h1>
          </div>

          <div className="flex justify-center mb-6">
            <img 
              src="/images/login-illustration.svg" 
              alt="Login" 
              className="h-40 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/150?text=Login';
              }}
            />
          </div>

          <div className="flex space-x-2 mb-6 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                !isPhoneLogin
                  ? 'bg-white dark:bg-dark-500 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light'
              }`}
              onClick={() => setIsPhoneLogin(false)}
            >
              Email
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                isPhoneLogin
                  ? 'bg-white dark:bg-dark-500 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light'
              }`}
              onClick={() => setIsPhoneLogin(true)}
            >
              Phone
            </button>
          </div>

          {isPhoneLogin ? (
            <form onSubmit={(e) => handlePhoneLogin(e)} className="space-y-4">
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="flex space-x-2">
                  <CountryCodeSelect 
                    selectedCode={countryCode} 
                    onSelect={setCountryCode} 
                    disabled={showOtpInput}
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`flex-1 ${inputClass} ${inputNormalClass}`}
                    placeholder="7025551234"
                    required
                    disabled={showOtpInput}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Enter your phone number without country code
                </p>
              </div>
              
              {showOtpInput && (
                <div>
                  <label className={labelClass}>OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`${inputClass} ${inputNormalClass}`}
                    placeholder="Enter OTP"
                    required
                  />
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition"
              >
                {showOtpInput ? 'Verify OTP' : 'Send OTP'}
              </button>

              {showOtpInput && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp('');
                  }}
                  className="w-full py-2 text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium transition"
                >
                  Change Phone Number
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={(e) => handleEmailLogin(e)} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  className={`${inputClass} ${fieldErrors.email ? inputErrorClass : inputNormalClass}`}
                  placeholder="your@email.com"
                  required
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email?.trim() && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    className={`${inputClass} pr-11 ${fieldErrors.password ? inputErrorClass : inputNormalClass}`}
                    placeholder="••••••••"
                    required
                    aria-invalid={!!fieldErrors.password}
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
                {fieldErrors.password?.trim() && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              {authError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-700 dark:text-red-300"
                >
                  {authError}
                </div>
              )}
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 dark:border-dark-400 rounded bg-white dark:bg-dark-700"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-800 dark:text-gray-200"
                  >
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm shrink-0">
                  <Link
                    to="/forgot-password"
                    className="text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition"
              >
                Login
              </button>

              {showResendConfirmation && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="w-full py-2.5 text-primary-600 dark:text-primary-300 border border-primary-600 dark:border-primary-400 rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-dark-500 transition"
                >
                  Resend Confirmation Email
                </button>
              )}
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-dark-500"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-dark-600 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 border border-gray-300 dark:border-dark-500 rounded-lg flex items-center justify-center space-x-2 bg-white dark:bg-dark-700 text-gray-800 dark:text-light hover:bg-gray-50 dark:hover:bg-dark-500 transition font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-semibold"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
