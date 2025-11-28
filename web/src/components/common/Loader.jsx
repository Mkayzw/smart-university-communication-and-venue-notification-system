// Reusable loading indicator with customizable label
export const Loader = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-3 text-sm font-semibold text-brand-600">
    {/* Animated ping dot for visual feedback */}
    <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-brand-500" />
    {/* Loading text label */}
    <span>{label}</span>
  </div>
)
