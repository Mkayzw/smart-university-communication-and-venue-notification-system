import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Megaphone, Bell, CalendarRange, CalendarClock, School, MapPin, User, LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth.js'

const navIconClasses = 'h-5 w-5'

const linkBaseClasses =
  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200'

const activeClasses = 'bg-brand-500/15 text-brand-700 shadow-inner shadow-brand-500/20 backdrop-blur-sm'
const inactiveClasses =
  'text-slate-500 hover:text-brand-600 hover:bg-brand-100/70 hover:shadow-sm hover:shadow-brand-500/10'

export const Sidebar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const items = useMemo(
    () => [
      { label: 'Overview', to: '/', icon: LayoutDashboard, roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
      { label: 'Announcements', to: '/announcements', icon: Megaphone, roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
      { label: 'All Courses', to: '/courses', icon: School, roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
      { label: 'My Courses', to: '/my-courses', icon: School, roles: ['LECTURER', 'STUDENT'] },
      { label: 'My Schedule', to: '/my-schedule', icon: CalendarClock, roles: ['LECTURER', 'STUDENT'] },
      { label: 'All Schedules', to: '/schedules', icon: CalendarRange, roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
      { label: 'Venues', to: '/venues', icon: MapPin, roles: ['ADMIN', 'LECTURER'] },
      { label: 'Notifications', to: '/notifications', icon: Bell, roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
      { label: 'Profile', to: '/profile', icon: User, roles: ['ADMIN', 'LECTURER', 'STUDENT'] }
    ],
    []
  )

  const allowedItems = items.filter((item) => !item.roles || item.roles.includes(user?.role))

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[250px] shrink-0 flex-col rounded-3xl border border-border/70 bg-white/80 p-6 shadow-soft backdrop-blur-xl lg:flex">
      <div className="flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-card">
            <span className="text-lg font-semibold">SU</span>
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold text-slate-900">Smart Uni</p>
            <p className="text-xs font-medium text-slate-500">Comms + Venue Hub</p>
          </div>
        </NavLink>
      </div>

      <div className="mt-8 flex-1 space-y-2">
        {allowedItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
              <Icon className={`${navIconClasses} ${isActive ? 'text-brand-600' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="mt-auto rounded-2xl bg-brand-100/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Logged in as</p>
        <p className="mt-2 text-sm font-semibold text-brand-900">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-slate-500">{user?.role}</p>
        <button
          onClick={logout}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-card transition hover:bg-brand-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
