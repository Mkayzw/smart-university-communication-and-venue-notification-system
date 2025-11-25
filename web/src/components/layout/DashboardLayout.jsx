import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { MobileNav } from './MobileNav.jsx'

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="fixed inset-0 pointer-events-none">
  <div className="absolute inset-0 bg-linear-to-br from-white via-white/40 to-[#e6f6f2]" />
        <div className="absolute -top-40 right-[-20%] h-[420px] w-[420px] rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute bottom-[-30%] left-[-10%] h-[360px] w-[360px] rounded-full bg-accent-200/40 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <Sidebar />
        <div className="flex flex-1 flex-col gap-6">
          <MobileNav />
          <Topbar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full rounded-3xl border border-border/70 bg-white/75 p-6 shadow-soft backdrop-blur-xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
