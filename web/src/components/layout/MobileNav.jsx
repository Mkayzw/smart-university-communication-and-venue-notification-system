import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/courses', label: 'All Courses' },
  { to: '/my-courses', label: 'My Courses', roles: ['LECTURER', 'STUDENT'] },
  { to: '/my-schedule', label: 'My Schedule', roles: ['LECTURER', 'STUDENT'] },
  { to: '/schedules', label: 'All Schedules' },
  { to: '/venues', label: 'Venues', roles: ['ADMIN', 'LECTURER'] },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' }
]

export const MobileNav = () => {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  const allowedItems = navItems.filter((item) => !item.roles || item.roles.includes(user?.role))

  return (
    <div className="lg:hidden">
      <button
        className="flex items-center gap-2 rounded-2xl border border-border/60 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>
      {open ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-border/70 bg-white/90 p-4 shadow-soft">
          {allowedItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600'}`
              }
              onClick={() => setOpen(false)}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Logged in as</p>
            <p className="mt-1 text-sm font-semibold text-brand-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500">{user?.role}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
