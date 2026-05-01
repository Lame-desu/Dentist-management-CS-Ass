export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-surface-900 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card border-surface-700 bg-surface-800/80 backdrop-blur-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
              <span className="text-2xl">🦷</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="mt-1 text-sm text-surface-400">Sign in to your DAMS account</p>
          </div>

          {/* Placeholder Form */}
          <div className="space-y-4">
            <p className="text-center text-sm text-surface-500">
              Login form will be implemented in the Authentication step.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
