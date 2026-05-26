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

  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-lg border ${
      errors[field] ? 'border-rose-500/50' : 'border-white/10'
    } bg-white/5 px-4 py-2.5 text-sm text-white placeholder-surface-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20`;

  if (registrationSuccess) {
    return (
      <div className="mx-auto w-full max-w-md animate-slide-up">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
            <p className="mt-3 text-sm text-surface-400">
              We&apos;ve sent a verification link to
            </p>
            <p className="mt-1 font-semibold text-primary-400">{registeredEmail}</p>
            <p className="mt-3 text-sm text-surface-400">
              Click the link in your email to verify your account and start using DAMS.
            </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-surface-300 transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
              <Link
                href="/login"
                className="block w-full rounded-xl bg-primary-600 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-primary-500 shadow-lg shadow-primary-500/25"
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
    <div className="mx-auto w-full max-w-4xl animate-slide-up">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
            <span className="text-2xl">🦷</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="mt-1 text-sm text-surface-400">
            Register as a patient at DAMS
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-6">
            <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
              {serverError}
            </Alert>
          </div>
        )}

        {/* Form — Two Column on Desktop */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Full Name <span className="text-rose-400">*</span>
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
                <p className="mt-1 text-xs text-rose-400">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Email Address <span className="text-rose-400">*</span>
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
                <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Phone Number <span className="text-rose-400">*</span>
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
                <p className="mt-1 text-xs text-rose-400">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Date of Birth <span className="text-rose-400">*</span>
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
                <p className="mt-1 text-xs text-rose-400">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Gender <span className="text-rose-400">*</span>
              </label>
              <select
                id="register-gender"
                value={formData.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className={`${inputClass('gender')} appearance-none`}
              >
                <option value="" disabled className="bg-surface-800">
                  Select gender
                </option>
                <option value="male" className="bg-surface-800">Male</option>
                <option value="female" className="bg-surface-800">Female</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-xs text-rose-400">{errors.gender}</p>
              )}
            </div>

            {/* Address (Optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Address
              </label>
              <input
                id="register-address"
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Addis Ababa, Ethiopia"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-surface-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Emergency Contact (Optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Emergency Contact
              </label>
              <input
                id="register-emergency"
                type="tel"
                value={formData.emergencyContact}
                onChange={(e) => updateField('emergencyContact', e.target.value)}
                placeholder="+251900000000"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-surface-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Spacer for alignment */}
            <div className="hidden sm:block" />

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Password <span className="text-rose-400">*</span>
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
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">
                Confirm Password <span className="text-rose-400">*</span>
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
                <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="!rounded-xl !py-3 text-base shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary-400 transition-colors hover:text-primary-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
