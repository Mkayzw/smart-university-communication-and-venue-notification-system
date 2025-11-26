import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, LockKeyhole, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { getErrorMessage, getFieldError } from '../../utils/errorHandler.js'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
    // Clear general error when user modifies form
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // Client-side validation
    const newFieldErrors = {}
    if (!form.email) {
      newFieldErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newFieldErrors.email = 'Please enter a valid email address'
    }
    
    if (!form.password) {
      newFieldErrors.password = 'Password is required'
    } else if (form.password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters'
    }
    
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      // Check for field-specific errors
      const emailError = getFieldError(err, 'email')
      const passwordError = getFieldError(err, 'password')
      
      if (emailError || passwordError) {
        setFieldErrors({
          email: emailError,
          password: passwordError
        })
      } else {
        // Use the enhanced error message handler
        setError(getErrorMessage(err))
      }
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
                <Mail className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${fieldErrors.email ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@university.edu"
                  className={`w-full rounded-2xl border ${fieldErrors.email ? 'border-red-400' : 'border-border/70'} bg-white/80 px-11 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-brand-500/5 outline-none transition focus:border-brand-400 focus:bg-white`}
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border ${fieldErrors.password ? 'border-red-400' : 'border-border/70'} bg-white/80 px-11 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-brand-500/5 outline-none transition focus:border-brand-400 focus:bg-white`}
                  value={form.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/60 bg-red-50 px-4 py-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                  {error.includes('internet connection') && (
                    <p className="text-xs text-red-600 mt-1">Please check your network settings and try again.</p>
                  )}
                </div>
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
