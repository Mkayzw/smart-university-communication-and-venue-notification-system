// Import Ghost icon for empty state visualization
import { Ghost } from 'lucide-react'

// Empty state component for when no data is available
export const EmptyState = ({ title = 'Nothing here yet', description, action }) => {
  return (
    <div className="center-grid w-full rounded-3xl border border-dashed border-border/70 bg-white/60 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* Ghost icon to represent empty state */}
        <Ghost className="h-8 w-8 text-brand-400" />
        <div>
          {/* Main title for the empty state */}
          <p className="text-base font-semibold text-slate-700">{title}</p>
          {/* Optional description providing more context */}
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {/* Optional action button or component */}
        {action || null}
      </div>
    </div>
  )
}
