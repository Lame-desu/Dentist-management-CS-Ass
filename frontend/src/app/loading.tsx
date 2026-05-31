export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/5 blur-[100px] animate-pulse-soft" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Tooth icon with spinner ring */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/10 ring-1 ring-primary-400/20">
            <span className="text-4xl animate-pulse-soft">🦷</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 animate-spin rounded-2xl border-2 border-transparent border-t-primary-500/40" style={{ animationDuration: '1.5s' }} />
        </div>

        {/* Brand */}
        <h2 className="mb-2 text-xl font-bold text-white">Bright Smile</h2>
        <p className="text-sm text-surface-400">Loading...</p>

        {/* Loading dots */}
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary-500/60 animate-pulse-soft"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
