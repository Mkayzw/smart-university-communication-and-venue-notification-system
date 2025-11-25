import { Search, Bell, HelpCircle, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useApiQuery } from '../../hooks/useApi.js'
import { Link } from 'react-router-dom'

export const Topbar = () => {
  const { user, logout } = useAuth()

  // Fetch notifications to get unread count
  const notificationsQuery = useApiQuery('/notifications', {
    params: { limit: 100, page: 1 },
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  const unreadCount = notificationsQuery.data?.data?.filter(n => !n.read).length || 0

  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white/80 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <h1 className="text-2xl font-semibold text-slate-900">{user?.firstName} {user?.lastName}</h1>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:w-64">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-2xl border border-border/70 bg-white/70 px-11 py-2 text-sm font-medium text-slate-600 shadow-inner shadow-brand-500/5 outline-none transition focus:border-brand-400 focus:bg-white focus:text-slate-900"
            placeholder="Search courses, venues, people"
            type="search"
          />
        </div>
        <Link
          to="/notifications"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-brand-500/90 text-white shadow-card transition hover:bg-brand-600"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link
          to="https://tailwindcss.com/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-white text-slate-600 shadow-sm transition hover:text-brand-600"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  )
}
