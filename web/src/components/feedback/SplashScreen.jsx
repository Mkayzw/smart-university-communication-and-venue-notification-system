export const SplashScreen = ({ label = 'Loading' }) => {
  return (
  <div className="center-grid min-h-screen bg-linear-to-br from-white via-brand-50 to-accent-100/60 text-brand-700">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-white/80 shadow-card backdrop-blur">
            <div className="center-grid h-full w-full animate-spin rounded-3xl border-4 border-brand-300 border-t-brand-500" />
          </div>
          <div className="absolute inset-0 animate-ping rounded-3xl border border-brand-400/70" />
        </div>
        <p className="text-lg font-semibold">{label}</p>
      </div>
    </div>
  )
}
