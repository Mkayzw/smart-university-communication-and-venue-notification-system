import { Ghost } from 'lucide-react'

export const EmptyState = ({ title = 'Nothing here yet', description, action }) => {
  return (
    <div className="center-grid w-full rounded-3xl border border-dashed border-border/70 bg-white/60 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <Ghost className="h-8 w-8 text-brand-400" />
        <div>
          <p className="text-base font-semibold text-slate-700">{title}</p>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action || null}
      </div>
    </div>
  )
}
