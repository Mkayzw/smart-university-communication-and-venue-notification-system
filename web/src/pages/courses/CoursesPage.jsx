import { useMemo, useState } from 'react'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.js'
import { CourseCard } from '../../components/cards/CourseCard.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { Modal } from '../../components/common/Modal.jsx'
import { AdminCourseForm } from '../../components/forms/AdminCourseForm.jsx'

const getEmptyCourseForm = () => ({
  code: '',
  name: '',
  department: '',
  description: '',
  credits: '',
  lecturerId: ''
})

export const CoursesPage = () => {
  const { user, status } = useAuth()
  const [filters, setFilters] = useState({ search: '', department: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(getEmptyCourseForm)
  const [createError, setCreateError] = useState(null)

  const coursesQuery = useApiQuery('/courses', {
    params: {
      page: 1,
      limit: 12,
      search: filters.search || undefined,
      department: filters.department || undefined
    }
  })

  const createCourseMutation = useApiMutation('/courses', {
    method: 'POST'
  })

  const departments = useMemo(() => {
    const results = coursesQuery.data?.data ?? []
    const set = new Set(results.map((course) => course.department).filter(Boolean))
    return Array.from(set)
  }, [coursesQuery.data])

  const normalizedRole = user?.role ? String(user.role).trim().toUpperCase() : ''
  // Only admins can create courses
  const canManage = normalizedRole === 'ADMIN' && status === 'authenticated'
  const actions = (
    <div className="flex w-full flex-wrap items-center gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <input
          className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none md:w-64"
          placeholder="Search course"
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
        />
        <select
          className="rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
          value={filters.department}
          onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>
      {canManage ? (
        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
          type="button"
          onClick={() => {
            setCreateError(null)
            setCreateForm(getEmptyCourseForm())
            setShowCreate(true)
          }}
        >
          Add course
        </button>
      ) : null}
    </div>
  )

  // Students cannot self-enroll through this UI
  // Enrollment is managed through a separate platform

  const handleCreateSubmit = async (formData) => {
    setCreateError(null)

    const code = formData.code.trim()
    const name = formData.name.trim()
    if (!code || !name) {
      setCreateError('Code and name are required.')
      return
    }

    const payload = { code, name }

    if (formData.department?.trim()) payload.department = formData.department.trim()
    if (formData.description?.trim()) payload.description = formData.description.trim()

    if (formData.credits) {
      const creditsValue = Number(formData.credits)
      if (Number.isNaN(creditsValue) || creditsValue < 0) {
        setCreateError('Credits should be a positive number.')
        return
      }
      payload.credits = creditsValue
    }

    if (user?.role === 'ADMIN' && formData.lecturerId?.trim()) {
      payload.lecturerId = formData.lecturerId.trim()
    }

    try {
      await createCourseMutation.mutateAsync(payload)
      setShowCreate(false)
      setCreateForm(getEmptyCourseForm())
      coursesQuery.refetch()
    } catch (err) {
      setCreateError(err.message || 'Failed to create course')
    }
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Browse all available courses. Enrollment is managed through a separate system."
        actions={actions}
      />

      {coursesQuery.isLoading ? (
        <Loader label="Fetching courses" />
      ) : coursesQuery.data?.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coursesQuery.data.data.map((course) => (
            <CourseCard key={course.id} course={course} onUpdate={coursesQuery.refetch} />
          ))}
        </div>
      ) : (
        <EmptyState description="Courses load after lecturers wake up." />
      )}

      {showCreate ? (
        <Modal
          title="Create course"
          subtitle={
            user?.role === 'ADMIN'
              ? 'Admins can set the lecturer right away or leave it blank.'
              : 'Drop the basics, we’ll pull students in once you publish.'
          }
          onClose={() => {
            setShowCreate(false)
            setCreateError(null)
          }}
          footer={
            <>
              <button
                className="rounded-2xl border border-border/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-300"
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setCreateError(null)
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
                type="submit"
                form="create-course-form"
                disabled={createCourseMutation.isPending}
              >
                {createCourseMutation.isPending ? 'Saving…' : 'Create course'}
              </button>
            </>
          }
        >
          <AdminCourseForm
            formData={createForm}
            setFormData={setCreateForm}
            onSubmit={handleCreateSubmit}
            error={createError}
          />
        </Modal>
      ) : null}
    </div>
  )
}
