import { CheckCircle2, CircleDot } from 'lucide-react'
import { Link } from 'react-router-dom'

export const NotificationItem = ({ notification, onMarkRead }) => {
  const { id, message, type, createdAt, read, link } = notification
  const created = new Date(createdAt)

  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-inner ${read ? 'opacity-80' : 'shadow-brand-500/10'}`}>
      {read ? <CheckCircle2 className="mt-1 h-4 w-4 text-slate-300" /> : <CircleDot className="mt-1 h-4 w-4 text-brand-500" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{message}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{type}</p>
        <p className="mt-1 text-xs text-slate-400">{created.toLocaleString()}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {link ? (
            <Link className="text-xs font-semibold text-brand-600" to={link}>
              Open
            </Link>
          ) : null}
          {!read ? (
            <button className="text-xs font-semibold text-slate-500" onClick={() => onMarkRead?.(id)} type="button">
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
