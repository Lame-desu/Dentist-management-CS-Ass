'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = searchParams.get('redirect');
      router.replace(redirect || getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, router, searchParams]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setResendSuccess(false);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Auth context will set user, useEffect above will redirect
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(message);
      if (status === 403) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await authApi.resendVerification(email);
      setResendCooldown(60);
      setResendSuccess(true);
    } catch {
      // Silent fail
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px] animate-slide-up">
      {/* Back to Home — visible on lg where side panel exists, or always on mobile */}
      <div className="mb-6 hidden lg:block">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-surface-500 transition-colors hover:text-white group"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* ─── Card ─── */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 ring-1 ring-primary-400/20 shadow-lg shadow-primary-500/10">
            <span className="text-3xl">🦷</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-sm text-surface-400">
            Sign in to access your appointments & records
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 animate-slide-down">
            <Alert variant="error" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Resend Verification Section */}
        {showResend && (
          <div className="mb-6 animate-slide-down">
            {resendSuccess && (
              <Alert variant="success" dismissible onDismiss={() => setResendSuccess(false)}>
                Verification email sent! Check your inbox.
              </Alert>
            )}
            {!resendSuccess && (
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full rounded-xl border border-primary-500/30 bg-primary-500/10 py-2.5 text-sm font-medium text-primary-400 transition-all hover:bg-primary-500/20 hover:border-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="group">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-surface-300">
              <svg className="h-4 w-4 text-surface-500 transition-colors group-focus-within:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-surface-600 transition-all duration-200 focus:border-primary-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500/15 hover:border-white/[0.12]"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="group">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-surface-300">
              <svg className="h-4 w-4 text-surface-500 transition-colors group-focus-within:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-surface-600 transition-all duration-200 focus:border-primary-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500/15 hover:border-white/[0.12]"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit button */}
          <div className="pt-1">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="!rounded-xl !py-3.5 text-base font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/25 transition-shadow"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="text-xs font-medium text-surface-600 uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Register CTA */}
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-semibold text-surface-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Create a new account
        </Link>
      </div>

      {/* Bottom text */}
      <p className="mt-6 text-center text-xs text-surface-600">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
