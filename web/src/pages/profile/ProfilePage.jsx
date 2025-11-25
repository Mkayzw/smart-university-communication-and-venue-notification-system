import { useState } from 'react'
import { useApiMutation } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { PageHeader } from '../../components/common/PageHeader.jsx'

export const ProfilePage = () => {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department || ''
  })
  const [message, setMessage] = useState(null)

  const updateMutation = useApiMutation(`/users/${user?.id}`, {
    method: 'PUT',
    onSuccess: (data) => {
      setUser(data)
      setMessage('Profile updated. No confetti though.')
    }
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)
    await updateMutation.mutateAsync(form)
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Tidy up your details so we spell your name right." />

      <form className="space-y-5 rounded-3xl border border-border/70 bg-white/80 p-6 shadow-inner" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600" htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600" htmlFor="department">
            Department
          </label>
          <input
            id="department"
            name="department"
            className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={form.department}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{user?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
          {message ? <p className="text-sm font-semibold text-brand-600">{message}</p> : null}
        </div>
      </form>
    </div>
  )
}
