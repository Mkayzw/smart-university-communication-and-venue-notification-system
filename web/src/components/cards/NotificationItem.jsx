import { CheckCircle2, CircleDot, Calendar, Bell, AlertCircle, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const getNotificationIcon = (type) => {
  if (type?.includes('SCHEDULE')) return Calendar
  if (type === 'NEW_ANNOUNCEMENT') return Bell
  return AlertCircle
}

const getNotificationColor = (type) => {
  if (type?.includes('SCHEDULE')) return 'text-blue-500'
  if (type === 'NEW_ANNOUNCEMENT') return 'text-purple-500'
  return 'text-slate-500'
}

export const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const { id, message, type, createdAt, read, link } = notification
  const created = new Date(createdAt)
  const Icon = getNotificationIcon(type)
  const iconColor = getNotificationColor(type)

  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-inner transition ${read ? 'opacity-70' : 'shadow-brand-500/10 border-brand-200'}`}>
      <div className={`mt-1 ${read ? 'opacity-50' : ''}`}>
        {read ? (
          <CheckCircle2 className="h-4 w-4 text-slate-300" />
        ) : (
          <CircleDot className="h-4 w-4 text-brand-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start gap-2">
          <Icon className={`h-4 w-4 mt-0.5 ${iconColor}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${read ? 'text-slate-600' : 'text-slate-800'}`}>{message}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{type?.replace(/_/g, ' ')}</p>
            <p className="mt-1 text-xs text-slate-400">{created.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {link ? (
            <Link 
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition" 
              to={link}
            >
              Open →
            </Link>
          ) : null}
          {!read && (
            <button 
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition" 
              onClick={() => onMarkRead?.(id)} 
              type="button"
            >
              Mark read
            </button>
          )}
          {onDelete && (
            <button 
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition flex items-center gap-1" 
              onClick={() => onDelete?.(id)} 
              type="button"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
