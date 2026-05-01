import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-surface-900 px-4">
      {/* ─── Decorative Background Elements ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary-400/10 blur-3xl" />
      </div>

      {/* ─── Main Content ─── */}
      <div className="relative z-10 flex flex-col items-center text-center animate-fade-in">
        {/* Logo / Icon */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/20 backdrop-blur-sm ring-1 ring-primary-400/30">
          <span className="text-4xl">🦷</span>
        </div>

        {/* Title */}
        <h1 className="mb-4 bg-gradient-to-r from-primary-200 via-primary-100 to-white bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          DAMS
        </h1>
        <p className="mb-2 text-lg font-medium text-primary-300 sm:text-xl">
          Dentist Appointments & Management System
        </p>
        <p className="mb-10 max-w-md text-sm text-surface-400">
          A comprehensive platform for Ethiopian private dental clinics — manage
          appointments, dental records, prescriptions, and more.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="btn-primary min-w-[160px] rounded-xl px-8 py-3 text-base shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-secondary min-w-[160px] rounded-xl border-surface-600 bg-white/5 px-8 py-3 text-base text-white backdrop-blur-sm hover:bg-white/10"
          >
            Register
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-16 text-xs text-surface-500">
          © {new Date().getFullYear()} DAMS. Designed for Ethiopian dental clinics.
        </p>
      </div>
    </main>
  );
}
