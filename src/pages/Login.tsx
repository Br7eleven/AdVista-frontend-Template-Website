import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import CountryCodeSelect from '../components/CountryCodeSelect';
import ThemeToggle from '../components/ThemeToggle';
import AuthBackground from '../components/AuthBackground';
import GlassCard from '../components/GlassCard';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { signInWithEmail, signInWithPhone, verifyOtp, signInWithGoogle, resendConfirmationEmail } from '../lib/auth';

gsap.registerPlugin(useGSAP);

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
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  // Stagger form fields on mount
  useGSAP(
    () => {
      if (!formRef.current) return;
      gsap.fromTo(
        formRef.current.querySelectorAll('.auth-field'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power2.out' }
      );
    },
    { scope: formRef }
  );

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => {
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

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setAuthError('');
      toast.error('Please fill in all required fields');
      return;
    }

    setFieldErrors({});
    setAuthError('');
    setLoading(true);
    const loadingToast = toast.loading('Signing in…');

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) throw new Error(typeof error === 'string' ? error : JSON.stringify(error));

      toast.dismiss(loadingToast);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      let errorMessage = 'Failed to sign in';

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
        setFieldErrors({ email: ' ', password: ' ' });
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email — check your inbox for the confirmation link.';
        setShowResendConfirmation(true);
        setFieldErrors({ email: 'Email not confirmed' });
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) { toast.error('Enter your phone number'); return; }
    if (showOtpInput && !otp) { toast.error('Enter the OTP code'); return; }

    const fullPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber}`;

    if (!showOtpInput) {
      setLoading(true);
      const t = toast.loading('Sending OTP…');
      try {
        const { error } = await signInWithPhone(fullPhone);
        if (error) throw new Error(error);
        toast.dismiss(t);
        setShowOtpInput(true);
        toast.success('OTP sent to your phone!');
      } catch (err: any) {
        toast.dismiss(t);
        toast.error(err.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      const t = toast.loading('Verifying OTP…');
      try {
        const { error } = await verifyOtp(fullPhone, otp);
        if (error) throw new Error(error);
        toast.dismiss(t);
        toast.success('Welcome back!');
        navigate('/');
      } catch (err: any) {
        toast.dismiss(t);
        toast.error(err.message || 'Invalid OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) { toast.error('Enter your email first'); return; }
    const t = toast.loading('Sending…');
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) throw new Error(error);
      toast.dismiss(t);
      toast.success('Check your inbox for the confirmation link');
      setShowResendConfirmation(false);
    } catch (err: any) {
      toast.dismiss(t);
      toast.error(err.message || 'Failed to resend');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="auth-layout">
      <AuthBackground />

      {/* Minimal top bar — theme toggle only */}
      <div className="flex justify-end px-4 pt-4" style={{ position: 'relative', zIndex: 10 }}>
        <ThemeToggle compact />
      </div>

      {/* Scrollable + centered card area */}
      <div style={{ position: 'relative', zIndex: 10 }} className="auth-scroll flex items-start justify-center px-4 pt-2 pb-4">
        <GlassCard className="w-full max-w-[420px] mx-auto mt-2" style={{ padding: '1.75rem' }}>
          <div ref={formRef}>
            <h1 className="font-display font-bold text-2xl text-stone-900 dark:text-stone-100 mb-1 text-center auth-field">
              {showOtpInput ? 'Enter your code' : 'Welcome back'}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 text-center auth-field">
              {showOtpInput
                ? 'We sent a code to your phone'
                : 'Sign in to continue earning rewards'}
            </p>

            {/* Auth tab toggle */}
            <div className="auth-tab-group auth-field">
              <button
                type="button"
                className={`auth-tab-btn ${!isPhoneLogin ? 'active' : ''}`}
                onClick={() => { setIsPhoneLogin(false); setShowOtpInput(false); }}
              >
                Email
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${isPhoneLogin ? 'active' : ''}`}
                onClick={() => { setIsPhoneLogin(true); setShowOtpInput(false); }}
              >
                Phone
              </button>
            </div>

            {/* ── Email Login ── */}
            {!isPhoneLogin && (
              <form onSubmit={handleEmailLogin} className="auth-form-stack mt-5">
                <div className="auth-field">
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="email">Email address</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                      className={`auth-input${fieldErrors.email ? ' field-error' : ''}`}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                        className={`auth-input${fieldErrors.password ? ' field-error' : ''}`}
                        style={{ paddingRight: '2.75rem' }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="auth-field auth-alert" role="alert">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-between auth-field">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="accent-rose-600"
                      defaultChecked
                    />
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="auth-btn-primary auth-field"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : 'Sign in'}
                </button>

                {showResendConfirmation && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    className="auth-btn-secondary auth-field"
                  >
                    Resend confirmation email
                  </button>
                )}
              </form>
            )}

            {/* ── Phone Login ── */}
            {isPhoneLogin && (
              <form onSubmit={handlePhoneLogin} className="auth-form-stack mt-5">
                {!showOtpInput ? (
                  <>
                    <div className="auth-field">
                      <div className="auth-input-group">
                        <label className="auth-label">Phone number</label>
                        <div className="flex gap-2">
                          <CountryCodeSelect
                            selectedCode={countryCode}
                            onSelect={setCountryCode}
                          />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="auth-input"
                            placeholder="702 555 1234"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {authError && (
                      <div className="auth-field auth-alert" role="alert">{authError}</div>
                    )}

                    <button
                      type="submit"
                      className="auth-btn-primary auth-field"
                      disabled={loading}
                    >
                      {loading ? 'Sending…' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="auth-field">
                      <div className="auth-input-group">
                        <label className="auth-label">Verification code</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="auth-input text-center text-lg tracking-widest font-mono"
                          placeholder="_ _ _ _ _ _"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="auth-btn-primary auth-field"
                      disabled={loading}
                    >
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowOtpInput(false); setOtp(''); }}
                      className="auth-btn-secondary auth-field"
                    >
                      Change phone number
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Divider + Google */}
            {!isPhoneLogin && (
              <>
                <div className="auth-divider auth-field">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">or</span>
                  <div className="auth-divider-line" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="auth-btn-secondary auth-field flex items-center justify-center gap-2.5"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {/* Footer */}
            <p className="auth-footer auth-field">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-rose-600 dark:text-rose-400 font-semibold hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}