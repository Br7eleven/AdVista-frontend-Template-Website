import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import CountryCodeSelect from '../components/CountryCodeSelect';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../lib/supabase';
import { signUpWithEmail, signInWithPhone, verifyOtp, signInWithGoogle } from '../lib/auth';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-700 text-gray-900 dark:text-light placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition';

const inputNormalClass =
  'border-gray-200 dark:border-dark-500 focus:ring-primary-500/40 focus:border-primary-500';

const inputErrorClass =
  'border-red-500 dark:border-red-400 focus:ring-red-500/40 focus:border-red-500';

const labelClass = 'block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5';

export default function Register() {
  const navigate = useNavigate();
  const [isPhoneRegistration, setIsPhoneRegistration] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const handleGoogleRegistration = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw new Error(error);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register with Google');
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col items-center justify-center px-4 py-6 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-200 dark:border-dark-500 overflow-hidden text-gray-900 dark:text-light relative">
          {/* Theme toggle at top-right corner of container */}
          <div className="absolute top-3 right-3 z-10">
            <ThemeToggle compact />
          </div>

          <div className="p-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-light mb-2">Thank you for your registration!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're glad you're here! Before you start exploring, we just sent you the email confirmation.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition"
            >
              Go to Login
            </button>

            <button
              onClick={() => setRegistrationComplete(false)}
              className="w-full mt-3 py-2 text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium transition"
            >
              Resend email confirmation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col items-center justify-center px-4 py-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-200 dark:border-dark-500 overflow-hidden text-gray-900 dark:text-light relative">
        {/* Theme toggle at top-right corner of container */}
        <div className="absolute top-3 right-3 z-10">
          <ThemeToggle compact />
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-center flex-1 pr-5 text-gray-900 dark:text-light">
              Create New Account
            </h1>
          </div>

          <div className="flex justify-center mb-6">
            <img
              src="/images/register-illustration.svg"
              alt="Register"
              className="h-40 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/150?text=Register';
              }}
            />
          </div>

          <div className="flex space-x-2 mb-6 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                !isPhoneRegistration
                  ? 'bg-white dark:bg-dark-500 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light'
              }`}
              onClick={() => setIsPhoneRegistration(false)}
            >
              Email
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                isPhoneRegistration
                  ? 'bg-white dark:bg-dark-500 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-light'
              }`}
              onClick={() => {
                setIsPhoneRegistration(true);
                toast('Note: Phone authentication requires additional Supabase configuration.', { icon: 'ℹ️' });
              }}
            >
              Phone
            </button>
          </div>

          {isPhoneRegistration ? (
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} ${inputNormalClass}`}
                  placeholder="John Doe"
                />
              </div>

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
                    disabled={showOtpInput}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Enter your phone number without country code
                </p>
              </div>

              {!showOtpInput && (
                <>
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-11 ${inputNormalClass}`}
                        placeholder="••••••••"
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
                    <label className={labelClass}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} ${inputNormalClass}`}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {showOtpInput && (
                <div>
                  <label className={labelClass}>OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`${inputClass} ${inputNormalClass}`}
                    placeholder="Enter OTP"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const fullPhoneNumber = phoneNumber.startsWith('+')
                    ? phoneNumber
                    : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;

                  if (!showOtpInput) {
                    if (password !== confirmPassword) {
                      toast.error('Passwords do not match');
                      return;
                    }

                    if (password.length < 6) {
                      toast.error('Password must be at least 6 characters long');
                      return;
                    }

                    const loadingToast = toast.loading('Sending OTP...');

                    signInWithPhone(fullPhoneNumber)
                      .then(({ error }) => {
                        if (error) {
                          toast.dismiss(loadingToast);
                          toast.error(error);
                          return;
                        }

                        toast.dismiss(loadingToast);
                        setShowOtpInput(true);
                        toast.success('OTP sent to your phone!');
                      })
                      .catch((err: any) => {
                        toast.dismiss(loadingToast);
                        toast.error('An unexpected error occurred');
                      });
                  } else {
                    const loadingToast = toast.loading('Verifying OTP...');

                    verifyOtp(fullPhoneNumber, otp)
                      .then(({ data, error }) => {
                        if (error) {
                          toast.dismiss(loadingToast);
                          toast.error(error);
                          return;
                        }

                        if (data?.user && data.user.id) {
                          const userData = {
                            name,
                            phone: fullPhoneNumber,
                          };

                          (async () => {
                            try {
                              const { error: profileError } = await supabase
                                .from('users')
                                .upsert([
                                  {
                                    id: data.user!.id,
                                    ...userData,
                                    created_at: new Date().toISOString(),
                                  },
                                ], { onConflict: 'id' });

                              if (profileError) {
                                toast.dismiss(loadingToast);
                                toast.error('Failed to create user profile');
                                return;
                              }

                              toast.dismiss(loadingToast);
                              toast.success('Registration successful!');
                              navigate('/');
                            } catch (err: any) {
                              toast.dismiss(loadingToast);
                              toast.error('An unexpected error occurred');
                            }
                          })();
                        } else {
                          toast.dismiss(loadingToast);
                          toast.success('Registration successful!');
                          navigate('/');
                        }
                      })
                      .catch((err: any) => {
                        toast.dismiss(loadingToast);
                        toast.error('An unexpected error occurred');
                      });
                  }
                }}
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
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} ${inputNormalClass}`}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} ${inputNormalClass}`}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11 ${inputNormalClass}`}
                    placeholder="••••••••"
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
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} ${inputNormalClass}`}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (password !== confirmPassword) {
                    toast.error('Passwords do not match');
                    return;
                  }

                  if (password.length < 6) {
                    toast.error('Password must be at least 6 characters long');
                    return;
                  }

                  const loadingToast = toast.loading('Creating your account...');

                  const userData = {
                    name,
                    email
                  };

                  signUpWithEmail(email, password, userData)
                    .then(({ error }) => {
                      if (error) {
                        toast.dismiss(loadingToast);
                        toast.error(error);
                        return;
                      }

                      toast.dismiss(loadingToast);
                      setRegistrationComplete(true);
                      toast.success('Registration successful! Please check your email for verification.');
                    })
                    .catch(err => {
                      toast.dismiss(loadingToast);
                      toast.error('An unexpected error occurred');
                    });
                }}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition"
              >
                Register
              </button>
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
                onClick={handleGoogleRegistration}
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
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-semibold"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
