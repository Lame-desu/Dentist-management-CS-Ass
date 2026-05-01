'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
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

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = searchParams.get('redirect');
      router.replace(redirect || getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, router, searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Auth context will set user, useEffect above will redirect
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md animate-slide-up">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
            <span className="text-2xl">🦷</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-surface-400">
            Sign in to your DAMS account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="error" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-surface-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-surface-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="!rounded-xl !py-3 text-base shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-surface-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary-400 transition-colors hover:text-primary-300"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
