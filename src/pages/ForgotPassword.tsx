import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import AuthBackground from '../components/AuthBackground';
import GlassCard from '../components/GlassCard';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { resetPassword } from '../lib/auth';

gsap.registerPlugin(useGSAP);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Enter your email address'); return; }
    setLoading(true);
    const t = toast.loading('Sending reset link…');
    try {
      const { error } = await resetPassword(email);
      if (error) throw new Error(error);
      toast.dismiss(t);
      setIsSubmitted(true);
      toast.success('Reset link sent — check your inbox');
    } catch (err: any) {
      toast.dismiss(t);
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
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
                <Mail size={30} className="text-rose-600 dark:text-rose-400" strokeWidth={1.75} />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl text-stone-900 dark:text-stone-100 mb-3 text-center">
              Check your email
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-2 leading-relaxed">
              We sent a reset link to<br />
              <strong className="text-stone-700 dark:text-stone-200">{email}</strong>
            </p>
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-7 leading-relaxed">
              Follow the instructions in the email to set a new password.
            </p>
            <Link to="/login" className="auth-btn-primary mb-3 w-full text-center block">
              Back to Sign in
            </Link>
            <button
              onClick={() => setIsSubmitted(false)}
              className="auth-btn-secondary w-full"
            >
              Use a different email
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <AuthBackground />

      <div className="flex justify-end px-4 pt-4" style={{ position: 'relative', zIndex: 10 }}>
        <ThemeToggle compact />
      </div>

      <div style={{ position: 'relative', zIndex: 10 }} className="auth-scroll flex items-start justify-center px-4 pt-2 pb-4">
        <GlassCard className="w-full max-w-[420px] mx-auto mt-2" style={{ padding: '1.75rem' }}>
          <div ref={formRef}>
            <h1 className="font-display font-bold text-2xl text-stone-900 dark:text-stone-100 mb-1 auth-field text-center">
              Forgot password?
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 auth-field text-center leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleReset} className="auth-form-stack">
              <div className="auth-field">
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="fp-email">Email address</label>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="you@example.com"
                    required
                    autoFocus
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
                    Sending…
                  </span>
                ) : 'Send reset link'}
              </button>
            </form>

            <p className="auth-footer auth-field">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-rose-600 dark:text-rose-400 font-semibold hover:text-rose-700 dark:hover:text-rose-300"
              >
                Back to Sign in
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}