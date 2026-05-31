'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  gender?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, router]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9]{9,15}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
      });
      setRegistrationSuccess(true);
      setRegisteredEmail(formData.email);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosError.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      await authApi.resendVerification(registeredEmail);
      setResendCooldown(60);
    } catch {
      // Silent fail
    } finally {
      setResendLoading(false);
    }
  }

  const baseInputClass =
    'w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-surface-600 transition-all duration-200 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500/15 hover:border-white/[0.12]';

  const inputClass = (field: keyof FormErrors) =>
    `${baseInputClass} ${
      errors[field]
        ? 'border-rose-500/40 focus:border-rose-500/60 focus:ring-rose-500/15'
        : 'border-white/[0.08] focus:border-primary-500/50'
    }`;

  // ─── Registration Success View ────────────────────────────────
  if (registrationSuccess) {
    return (
      <div className="mx-auto w-full max-w-md animate-slide-up">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
          <div className="text-center">
            {/* Success animation */}
            <div className="mx-auto mb-6 relative">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-400/20 shadow-lg shadow-emerald-500/10">
                <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              {/* Decorative ring pulse */}
              <div className="absolute inset-0 mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute h-20 w-20 animate-ping rounded-full bg-emerald-500/10" style={{ animationDuration: '2s' }} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">Check Your Email</h1>
            <p className="mt-3 text-sm text-surface-400 leading-relaxed">
              We&apos;ve sent a verification link to
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary-500/10 px-4 py-2 ring-1 ring-primary-500/20">
              <svg className="h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <span className="font-semibold text-primary-400 text-sm">{registeredEmail}</span>
            </div>
            <p className="mt-4 text-sm text-surface-500 leading-relaxed">
              Click the link in your email to verify your account and start booking appointments.
            </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-surface-300 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.15] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary-600 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-primary-500 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Registration Form View ───────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-[800px] animate-slide-up">
      {/* Back to Home — desktop only (mobile has top bar) */}
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h1>
          <p className="mt-2 text-sm text-surface-400">
            Register as a new patient — it only takes a minute
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-6 animate-slide-down">
            <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
              {serverError}
            </Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* ─── Section: Personal Info ─── */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500/15 text-primary-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Personal Information</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Full Name <span className="text-rose-400/80">*</span>
                </label>
                <input
                  id="register-fullname"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="John Doe"
                  className={inputClass('fullName')}
                />
                {errors.fullName && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Email Address <span className="text-rose-400/80">*</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass('email')}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Phone Number <span className="text-rose-400/80">*</span>
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  placeholder="+251911234567"
                  className={inputClass('phoneNumber')}
                />
                {errors.phoneNumber && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Date of Birth <span className="text-rose-400/80">*</span>
                </label>
                <input
                  id="register-dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className={`${inputClass('dateOfBirth')} [color-scheme:dark]`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Gender <span className="text-rose-400/80">*</span>
                </label>
                <select
                  id="register-gender"
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className={`${inputClass('gender')} appearance-none`}
                >
                  <option value="" disabled className="bg-surface-900">
                    Select gender
                  </option>
                  <option value="male" className="bg-surface-900">Male</option>
                  <option value="female" className="bg-surface-900">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Section: Additional Info ─── */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500/15 text-primary-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Additional Details</span>
              <span className="ml-auto text-xs text-surface-600">Optional</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Address */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Address
                </label>
                <input
                  id="register-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Addis Ababa, Ethiopia"
                  className={baseInputClass + ' border-white/[0.08] focus:border-primary-500/50'}
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Emergency Contact
                </label>
                <input
                  id="register-emergency"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => updateField('emergencyContact', e.target.value)}
                  placeholder="+251900000000"
                  className={baseInputClass + ' border-white/[0.08] focus:border-primary-500/50'}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* ─── Section: Security ─── */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500/15 text-primary-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Security</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Password <span className="text-rose-400/80">*</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputClass('password')}
                  autoComplete="new-password"
                />
                {errors.password ? (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.password}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-surface-600">Must include uppercase, lowercase & number</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-400">
                  Confirm Password <span className="text-rose-400/80">*</span>
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputClass('confirmPassword')}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="!rounded-xl !py-3.5 text-base font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/25 transition-shadow"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="text-xs font-medium text-surface-600 uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Sign In CTA */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-semibold text-surface-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          Already have an account? Sign in
        </Link>
      </div>

      {/* Bottom text */}
      <p className="mt-6 text-center text-xs text-surface-600">
        By registering, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
