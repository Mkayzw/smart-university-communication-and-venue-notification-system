export const Loader = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-3 text-sm font-semibold text-brand-600">
    <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-brand-500" />
    <span>{label}</span>
  </div>
)
