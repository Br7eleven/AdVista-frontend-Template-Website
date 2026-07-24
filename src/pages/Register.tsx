import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import CountryCodeSelect from '../components/CountryCodeSelect';
import ThemeToggle from '../components/ThemeToggle';
import AuthBackground from '../components/AuthBackground';
import GlassCard from '../components/GlassCard';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { supabase } from '../lib/supabase';
import { signUpWithEmail, signInWithPhone, verifyOtp, signInWithGoogle } from '../lib/auth';

gsap.registerPlugin(useGSAP);

export default function Register() {
  const navigate = useNavigate();
  const [isPhoneReg, setIsPhoneReg] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

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

  if (registrationComplete) {
    return (
      <div className="auth-layout">
        <AuthBackground />
        <div className="flex justify-end px-4 pt-4" style={{ position: 'relative', zIndex: 10 }}>
          <ThemeToggle compact />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }} className="auth-scroll flex items-start justify-center px-4 pt-6 pb-4">
          <GlassCard className="w-full max-w-[420px] mx-auto mt-2 text-center" style={{ padding: '2rem' }}>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(230,0,35,0.12)' }}>
                <ShieldCheck size={32} className="text-rose-600 dark:text-rose-400" strokeWidth={1.75} />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl text-stone-900 dark:text-stone-100 mb-3 text-center">
              You're almost there!
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
              We sent a confirmation link to <strong className="text-stone-700 dark:text-stone-200">{email}</strong>.<br />
              Click the link in your inbox to activate your account.
            </p>
            <button onClick={() => navigate('/login')} className="auth-btn-primary mb-3 w-full">
              Go to Sign in
            </button>
            <button onClick={() => setRegistrationComplete(false)} className="auth-btn-secondary w-full">
              Resend confirmation email
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter your full name'); return; }
    if (!email.trim()) { toast.error('Enter your email'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    const t = toast.loading('Creating account…');
    try {
      const { error } = await signUpWithEmail(email, password, { name, email });
      if (error) throw typeof error === 'string' ? new Error(error) : error;
      toast.dismiss(t);
      setRegistrationComplete(true);
      toast.success('Check your inbox to verify your email');
    } catch (err: any) {
      toast.dismiss(t);
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber}`;

    if (!showOtpInput) {
      if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
      if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
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
      if (!otp) { toast.error('Enter the OTP code'); return; }
      setLoading(true);
      const t = toast.loading('Verifying…');
      try {
        const { error } = await verifyOtp(fullPhone, otp);
        if (error) throw new Error(error);

        // upsert profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').upsert(
            { id: user.id, name, phone: fullPhone, created_at: new Date().toISOString() },
            { onConflict: 'id' }
          );
        }

        toast.dismiss(t);
        toast.success('Account created!');
        navigate('/');
      } catch (err: any) {
        toast.dismiss(t);
        toast.error(err.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign up with Google');
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
              {showOtpInput ? 'Check your phone' : 'Create your account'}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 text-center auth-field">
              {showOtpInput ? 'Enter the code we just sent you' : 'Start earning rewards today — free forever'}
            </p>

            {/* Tab toggle */}
            <div className="auth-tab-group auth-field">
              <button
                type="button"
                className={`auth-tab-btn ${!isPhoneReg ? 'active' : ''}`}
                onClick={() => { setIsPhoneReg(false); setShowOtpInput(false); }}
              >
                Email
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${isPhoneReg ? 'active' : ''}`}
                onClick={() => { setIsPhoneReg(true); setShowOtpInput(false); }}
              >
                Phone
              </button>
            </div>

            {/* ── Email Registration ── */}
            {!isPhoneReg && (
              <form onSubmit={handleEmailRegister} className="auth-form-stack mt-5">
                <div className="auth-field">
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-name">Full name</label>
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="auth-input"
                      placeholder="Alex Rivera"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-email">Email address</label>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      placeholder="alex@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-pw">Password</label>
                    <input
                      id="reg-pw"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input"
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-cpw">Confirm password</label>
                    <input
                      id="reg-cpw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input"
                      placeholder="Repeat your password"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-btn-primary auth-field" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : 'Create account'}
                </button>
              </form>
            )}

            {/* ── Phone Registration ── */}
            {isPhoneReg && (
              <form onSubmit={handlePhoneRegister} className="auth-form-stack mt-5">
                {!showOtpInput ? (
                  <>
                    <div className="auth-field">
                      <div className="auth-input-group">
                        <label className="auth-label">Full name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="auth-input"
                          placeholder="Alex Rivera"
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <div className="auth-input-group">
                        <label className="auth-label">Phone number</label>
                        <div className="flex gap-2">
                          <CountryCodeSelect selectedCode={countryCode} onSelect={setCountryCode} />
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

                    <div className="auth-field">
                      <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-input"
                          placeholder="Min. 6 characters"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <div className="auth-input-group">
                        <label className="auth-label">Confirm password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="auth-input"
                          placeholder="Repeat your password"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-btn-primary auth-field" disabled={loading}>
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

                    <button type="submit" className="auth-btn-primary auth-field" disabled={loading}>
                      {loading ? 'Verifying…' : 'Verify & create account'}
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
            {!isPhoneReg && (
              <>
                <div className="auth-divider auth-field">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">or</span>
                  <div className="auth-divider-line" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  className="auth-btn-secondary auth-field flex items-center justify-center gap-2.5"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </button>
              </>
            )}

            <p className="auth-footer auth-field">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-rose-600 dark:text-rose-400 font-semibold hover:text-rose-700 dark:hover:text-rose-300"
              >
                Sign in
              </Link>
            </p>

            <p className="text-center text-[11px] text-stone-400 dark:text-stone-600 mt-3 auth-field">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}