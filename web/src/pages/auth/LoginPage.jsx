import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      setError('Email + password, please and thanks')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed miserably')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-white via-brand-100/30 to-accent-100/40">
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(21,130,112,0.2),transparent_60%)]" />
        <div className="mx-auto w-full max-w-md rounded-3xl border border-border/70 bg-white/90 p-8 shadow-soft backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-card">
              <span className="text-xl font-semibold">SU</span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">Smart Uni Hub</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Sign in to catch announcements, schedules, and more</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@university.edu"
                  className="w-full rounded-2xl border border-border/70 bg-white/80 px-11 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-brand-500/5 outline-none transition focus:border-brand-400 focus:bg-white"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border/70 bg-white/80 px-11 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-brand-500/5 outline-none transition focus:border-brand-400 focus:bg-white"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-accent-400/60 bg-accent-100/80 px-4 py-3 text-sm font-semibold text-accent-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">
            Yeah there’s no self-serve signup. Ask the admin squad.
          </p>
        </div>
      </div>
    </div>
  )
}
