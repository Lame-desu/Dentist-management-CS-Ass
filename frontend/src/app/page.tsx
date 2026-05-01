import Link from 'next/link';

// ─── Feature Cards Data ────────────────────────────────────────
const features = [
  {
    icon: '📅',
    title: 'Online Booking',
    description: 'Book dental appointments online anytime, anywhere. Choose your preferred dentist, date, and time slot with just a few clicks.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
  },
  {
    icon: '📋',
    title: 'Digital Records',
    description: 'Access complete dental history, diagnoses, treatments, and prescriptions in a secure digital format — no more paper files.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20',
  },
  {
    icon: '🎫',
    title: 'Smart Queue',
    description: 'Real-time queue management with live status updates. Know your position and estimated wait time before you arrive.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/20',
  },
  {
    icon: '📊',
    title: 'Clinic Dashboard',
    description: 'Powerful analytics and reporting for clinic administrators. Track appointments, revenue, and staff performance at a glance.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20',
  },
];

// ─── How It Works Steps ────────────────────────────────────────
const steps = [
  {
    number: '01',
    title: 'Book',
    description: 'Browse available dentists and select a convenient time slot for your appointment.',
    icon: '🔍',
  },
  {
    number: '02',
    title: 'Visit',
    description: 'Check in at the clinic. The smart queue system ensures minimal wait times.',
    icon: '🏥',
  },
  {
    number: '03',
    title: 'Track',
    description: 'Access your dental records, prescriptions, and follow-up schedules digitally.',
    icon: '📱',
  },
];

export default function HomePage() {
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
      <nav className="relative z-20 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
              <span className="text-xl">🦷</span>
            </div>
            <span className="text-xl font-bold tracking-tight">DAMS</span>
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
      <section className="relative z-10 px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
            </span>
            Now open for Ethiopian dental clinics
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-primary-100 to-primary-300 bg-clip-text text-transparent">
              Modernizing
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-200 bg-clip-text text-transparent">
              Dental Care in Ethiopia
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-surface-400 sm:text-xl">
            A comprehensive management platform that streamlines appointments, records, prescriptions, and queue management for modern dental clinics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group relative inline-flex min-w-[200px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-primary-500/30 transition-all duration-300 hover:shadow-primary-500/50 active:scale-[0.97]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-400 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                Sign In
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
            <Link
              href="/register"
              className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 active:scale-[0.97]"
            >
              Create Account
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
            {[
              { value: '4', label: 'User Roles' },
              { value: '15+', label: 'API Endpoints' },
              { value: '11', label: 'Database Tables' },
              { value: '100%', label: 'Digital Records' },
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
      {/* FEATURES SECTION                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/5 bg-surface-950/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                Everything Your Clinic Needs
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-surface-400">
              From patient registration to treatment records — manage every aspect of your dental practice in one unified platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl ring-1 ring-white/10">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-surface-300">{feature.description}</p>

                {/* Hover glow effect */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-surface-400">
              Get started in three simple steps. No complicated setup required.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
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
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROLES SECTION                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/5 bg-surface-950/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              <span className="bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                Built for Every Role
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-surface-400">
              Tailored dashboards and workflows for each member of your dental team.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { role: 'Patient', icon: '👤', abilities: ['Book appointments online', 'View dental records', 'Access prescriptions', 'Track queue status'] },
              { role: 'Receptionist', icon: '📞', abilities: ['Review & forward requests', 'Register walk-ins', 'Manage live queue', 'Handle scheduling'] },
              { role: 'Dentist', icon: '🩺', abilities: ['View daily schedule', 'Approve appointments', 'Write consultations', 'Issue prescriptions'] },
              { role: 'Admin', icon: '⚙️', abilities: ['Manage staff accounts', 'Configure clinic settings', 'View reports & analytics', 'System oversight'] },
            ].map((item) => (
              <div key={item.role} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary-500/20 hover:bg-white/[0.04]">
                <div className="mb-4 text-3xl">{item.icon}</div>
                <h3 className="mb-3 text-lg font-semibold text-white">{item.role}</h3>
                <ul className="space-y-2">
                  {item.abilities.map((ability) => (
                    <li key={ability} className="flex items-start gap-2 text-sm text-surface-400">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {ability}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-500/10 via-primary-600/5 to-transparent p-12 sm:p-16">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ready to Modernize Your Clinic?
            </h2>
            <p className="mb-8 text-surface-400">
              Join Ethiopian dental clinics that are already using DAMS to deliver better patient experiences.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/25 transition-all hover:bg-primary-500 hover:shadow-primary-500/40 active:scale-[0.97]"
              >
                Create Free Account
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
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FOOTER                                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦷</span>
            <span className="font-semibold text-surface-300">DAMS</span>
            <span className="text-surface-600">—</span>
            <span className="text-sm text-surface-500">Dentist Appointments & Management System</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <p className="text-sm text-surface-500">
              © {new Date().getFullYear()} DAMS. All rights reserved.
            </p>
            <p className="text-xs text-surface-600">
              Built as BSc Final Project — Addis Ababa, Ethiopia
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
