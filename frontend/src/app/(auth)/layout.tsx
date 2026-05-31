import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* ─── Left Panel — Branded Illustration (hidden on mobile) ─── */}
      <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden lg:flex lg:flex-col">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-950" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating decorative orbs */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-primary-400/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-300/5 blur-2xl animate-pulse-soft" style={{ animationDelay: '3s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          {/* Top — Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 transition-all group-hover:bg-white/15 group-hover:ring-white/30">
              <span className="text-xl">🦷</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-tight tracking-tight">Bright Smile</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-200/70 leading-tight">Dental Clinic</span>
            </div>
          </Link>

          {/* Center — Illustration area */}
          <div className="flex flex-col items-center py-8">
            {/* Floating dental icons */}
            <div className="relative mb-8 h-44 w-44">
              {/* Central tooth */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm shadow-2xl">
                  <span className="text-5xl">🦷</span>
                </div>
              </div>
              {/* Orbiting icons */}
              <div className="absolute -left-2 top-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 animate-pulse-soft" style={{ animationDelay: '0.5s' }}>
                <span className="text-lg">✨</span>
              </div>
              <div className="absolute -right-3 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 animate-pulse-soft" style={{ animationDelay: '1s' }}>
                <span className="text-lg">💎</span>
              </div>
              <div className="absolute -left-1 bottom-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 animate-pulse-soft" style={{ animationDelay: '1.5s' }}>
                <span className="text-lg">❤️</span>
              </div>
              <div className="absolute -right-1 bottom-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10 animate-pulse-soft" style={{ animationDelay: '2s' }}>
                <span className="text-sm">📅</span>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="mb-3 text-center text-2xl font-bold text-white leading-snug">
              Your Smile,<br />Our Priority
            </h2>
            <p className="max-w-[280px] text-center text-sm leading-relaxed text-primary-100/60">
              Modern dental care with online booking, digital records, and a patient-first approach.
            </p>
          </div>

          {/* Bottom — Trust badges */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">Secure & Private</p>
                <p className="text-xs text-primary-200/50">Your data is encrypted and protected</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">Quick & Easy</p>
                <p className="text-xs text-primary-200/50">Register in under a minute</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Form Area ─── */}
      <div className="relative flex flex-1 flex-col">
        {/* Background decorations for right panel */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary-500/[0.03] blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary-400/[0.03] blur-[100px]" />
        </div>

        {/* Mobile-only top bar with logo */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/20 ring-1 ring-primary-400/30">
              <span className="text-lg">🦷</span>
            </div>
            <span className="text-base font-bold text-white">Bright Smile</span>
          </Link>
        </div>

        {/* Scrollable form content */}
        <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
