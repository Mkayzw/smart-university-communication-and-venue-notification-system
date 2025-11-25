import { X } from 'lucide-react'

export const Modal = ({ title, subtitle, onClose, children, footer }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-border/60 bg-white/95 p-6 shadow-soft">
        <button
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:text-brand-600"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6 space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="space-y-4">{children}</div>
        {footer ? <div className="mt-6 flex items-center justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  )
}
