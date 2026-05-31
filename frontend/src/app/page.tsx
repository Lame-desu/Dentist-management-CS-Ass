'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// ─── Dental Services ────────────────────────────────────────
const services = [
  {
    icon: '✨',
    title: 'Teeth Cleaning & Whitening',
    description:
      'Professional cleaning and whitening treatments to restore your smile\'s natural brilliance and maintain optimal oral health.',
    gradient: 'from-sky-500/20 to-cyan-500/20',
    border: 'border-sky-500/20',
  },
  {
    icon: '🦷',
    title: 'Root Canal Treatment',
    description:
      'Expert endodontic procedures using modern equipment to save damaged teeth and relieve pain with minimal discomfort.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20',
  },
  {
    icon: '💎',
    title: 'Cosmetic Dentistry',
    description:
      'Transform your smile with veneers, bonding, and aesthetic restorations crafted to look and feel completely natural.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/20',
  },
  {
    icon: '🔧',
    title: 'Orthodontics & Braces',
    description:
      'Customized orthodontic solutions including traditional braces and clear aligners for a perfectly aligned smile.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20',
  },
];

// ─── How It Works Steps ────────────────────────────────────────
const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description:
      'Register in under a minute with your basic details. Your information is safe and secure with us.',
    icon: '📝',
  },
  {
    number: '02',
    title: 'Book an Appointment',
    description:
      'Choose your preferred date and time. Our system shows available slots so you can plan ahead.',
    icon: '📅',
  },
  {
    number: '03',
    title: 'Visit & Get Treated',
    description:
      'Come to the clinic at your scheduled time. Skip the long wait — your slot is reserved just for you.',
    icon: '😁',
  },
];

// ─── Why Choose Us ─────────────────────────────────────────────
const reasons = [
  {
    icon: '🏥',
    title: 'Modern Facility',
    description: 'State-of-the-art equipment and sterilized environment for every procedure.',
  },
  {
    icon: '👨‍⚕️',
    title: 'Expert Dentist',
    description: 'Experienced and certified dental professional dedicated to your oral health.',
  },
  {
    icon: '💰',
    title: 'Affordable Care',
    description: 'Transparent pricing with no hidden fees. Quality dental care that fits your budget.',
  },
  {
    icon: '🕐',
    title: 'Convenient Hours',
    description: 'Flexible scheduling including evening and weekend appointments for your convenience.',
  },
  {
    icon: '📱',
    title: 'Digital Experience',
    description: 'Book online, access your records digitally, and track your appointments with ease.',
  },
  {
    icon: '❤️',
    title: 'Patient-First Approach',
    description: 'We listen to your concerns and create personalized treatment plans for every patient.',
  },
];

// ─── Testimonials ──────────────────────────────────────────────
const testimonials = [
  {
    name: 'Abebe Tadesse',
    text: 'Booking online saved me so much time. The queue system meant I barely had to wait at the clinic. Highly recommend!',
    role: 'Patient',
    avatar: 'AT',
  },
  {
    name: 'Sara Mulugeta',
    text: 'The digital records are a game changer — I can see all my treatment history and prescriptions in one place.',
    role: 'Patient',
    avatar: 'SM',
  },
  {
    name: 'Daniel Kebede',
    text: 'Professional service and a beautiful, clean clinic. The online system makes everything so convenient.',
    role: 'Patient',
    avatar: 'DK',
  },
];

// ─── Scroll Animation Hook ────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// ─── Animated Section Wrapper ──────────────────────────────────
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-surface-950 text-white overflow-hidden">
      {/* ─── Animated Background ─── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary-500/8 blur-[120px] animate-pulse-soft" />
        <div className="absolute -bottom-60 -right-40 h-[600px] w-[600px] rounded-full bg-primary-400/6 blur-[150px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary-600/5 blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* NAVBAR                                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-white/10 bg-surface-950/90 backdrop-blur-xl shadow-lg shadow-black/10' : 'border-transparent bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
              <span className="text-xl">🦷</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-tight">Bright Smile</span>
              <span className="text-[10px] uppercase tracking-widest text-primary-400 leading-tight">Dental Clinic</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm text-surface-400 transition-colors hover:text-white">Services</a>
            <a href="#how-it-works" className="text-sm text-surface-400 transition-colors hover:text-white">How It Works</a>
            <a href="#why-us" className="text-sm text-surface-400 transition-colors hover:text-white">Why Choose Us</a>
            <a href="#testimonials" className="text-sm text-surface-400 transition-colors hover:text-white">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-5 py-2 text-sm font-medium text-surface-300 transition-all hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
            </span>
            Now accepting new patients — Book online today!
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-primary-100 to-primary-300 bg-clip-text text-transparent">
              Your Smile,
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-200 bg-clip-text text-transparent">
              Our Priority
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-surface-400 sm:text-xl">
            Welcome to Bright Smile Dental Clinic — where modern technology meets compassionate care.
            Book appointments online, skip the wait, and keep your dental records at your fingertips.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group relative inline-flex min-w-[200px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-primary-500/30 transition-all duration-300 hover:shadow-primary-500/50 active:scale-[0.97]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-400 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                Book Your Visit
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 active:scale-[0.97]"
            >
              Sign In to Your Account
            </Link>
          </div>

          {/* Stats — Patient-Facing */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
            {[
              { value: '10+', label: 'Years of Experience' },
              { value: '5,000+', label: 'Happy Patients' },
              { value: '15+', label: 'Dental Services' },
              { value: '98%', label: 'Patient Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary-400 sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-surface-500 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SERVICES SECTION                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="services" className="relative z-10 border-t border-white/5 bg-surface-950/50 px-6 py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                  Our Dental Services
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-surface-400">
                Comprehensive dental care tailored to your needs — from routine check-ups to advanced restorative treatments.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((service, i) => (
              <AnimatedSection key={service.title} delay={i * 100}>
                <div
                  className={`group relative overflow-hidden rounded-2xl border ${service.border} bg-gradient-to-br ${service.gradient} p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-full`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl ring-1 ring-white/10">
                    {service.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-surface-300">{service.description}</p>

                  {/* Hover glow effect */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 border-t border-white/5 px-6 py-24 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                  How It Works
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-surface-400">
                Getting started is quick and easy. Follow these three simple steps to book your first appointment.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <AnimatedSection key={step.number} delay={index * 150}>
                <div className="relative text-center">
                  {/* Connector line (between cards) */}
                  {index < steps.length - 1 && (
                    <div className="absolute right-0 top-12 hidden h-px w-8 translate-x-full bg-gradient-to-r from-primary-500/40 to-transparent sm:block" />
                  )}

                  <div className="mx-auto mb-6 flex h-24 w-24 flex-col items-center justify-center rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-500/10 to-primary-600/5">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-500">
                    Step {step.number}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-surface-400">{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* WHY CHOOSE US                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="why-us" className="relative z-10 border-t border-white/5 bg-surface-950/50 px-6 py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                  Why Choose Bright Smile?
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-surface-400">
                We combine clinical excellence with a warm, patient-first approach to make every visit comfortable and stress-free.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason, i) => (
              <AnimatedSection key={reason.title} delay={i * 80}>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary-500/20 hover:bg-white/[0.04] h-full">
                  <div className="mb-4 text-3xl">{reason.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{reason.title}</h3>
                  <p className="text-sm leading-relaxed text-surface-400">{reason.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative z-10 border-t border-white/5 px-6 py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                  What Our Patients Say
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-surface-400">
                Don&apos;t just take our word for it — hear from patients who trust us with their smiles.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 120}>
                <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
                  {/* Stars */}
                  <div className="mb-4 flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mb-6 flex-1 text-sm leading-relaxed text-surface-300 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/20 text-sm font-bold text-primary-400">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-surface-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/5 px-6 py-24">
        <AnimatedSection>
          <div className="mx-auto max-w-3xl text-center">
            <div className="rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-500/10 via-primary-600/5 to-transparent p-12 sm:p-16">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Ready for a Healthier Smile?
              </h2>
              <p className="mb-8 text-surface-400">
                Join thousands of patients who trust Bright Smile Dental Clinic for their oral health. Register now and book your first appointment in minutes.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/25 transition-all hover:bg-primary-500 hover:shadow-primary-500/40 active:scale-[0.97]"
                >
                  Register Now — It&apos;s Free
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-surface-400 transition-colors hover:text-white"
                >
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FOOTER                                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🦷</span>
                <span className="font-bold text-white">Bright Smile</span>
              </div>
              <p className="text-sm text-surface-500 leading-relaxed">
                Modern dental care with a personal touch. Your oral health is our mission.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-surface-300 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#services" className="text-sm text-surface-500 hover:text-white transition-colors">Our Services</a></li>
                <li><a href="#how-it-works" className="text-sm text-surface-500 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#why-us" className="text-sm text-surface-500 hover:text-white transition-colors">Why Choose Us</a></li>
                <li><a href="#testimonials" className="text-sm text-surface-500 hover:text-white transition-colors">Testimonials</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-surface-300 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2 text-sm text-surface-500">
                <li className="flex items-center gap-2">
                  <span>📍</span> Addis Ababa, Ethiopia
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span> +251 911 234 567
                </li>
                <li className="flex items-center gap-2">
                  <span>✉️</span> info@brightsmile.et
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-white/5 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-surface-600">
              © {new Date().getFullYear()} Bright Smile Dental Clinic. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-surface-500 hover:text-white transition-colors">Sign In</Link>
              <span className="text-surface-700">|</span>
              <Link href="/register" className="text-sm text-surface-500 hover:text-white transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
