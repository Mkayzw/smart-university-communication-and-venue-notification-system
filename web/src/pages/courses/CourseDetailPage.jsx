import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Users, CalendarRange, BookOpen, Plus } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi.js'
import { Loader } from '../../components/common/Loader.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ScheduleCard } from '../../components/cards/ScheduleCard.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import ScheduleForm from '../../components/forms/ScheduleForm.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export const CourseDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  const { user } = useAuth()

  const courseQuery = useApiQuery(`/courses/${id}`)
  const canSeeRoster = user?.role === 'ADMIN' || user?.role === 'LECTURER'
  const rosterQuery = useApiQuery(`/courses/${id}/students`, {
    params: { limit: 10, page: 1 },
    enabled: !!id && canSeeRoster
  })

  const venuesQuery = useApiQuery('/venues', {
    params: { limit: 100 },
    enabled: isScheduleModalOpen
  })

  const createScheduleMutation = useApiMutation('/schedules', {
    method: 'POST',
    onSuccess: () => {
      setIsScheduleModalOpen(false)
      courseQuery.refetch()
    }
  })

  const handleCreateSchedule = (data) => {
    // Pre-fill the courseId since we're creating from course detail page
    createScheduleMutation.mutate({
      ...data,
      courseId: id
    })
  }

  const canManageSchedule = user?.role === 'ADMIN' || (user?.role === 'LECTURER' && user?.id === course?.lecturerId)

  if (courseQuery.isLoading) {
    return <Loader label="Loading course" />
  }

  const course = courseQuery.data?.data || courseQuery.data

  if (!course) {
    return <EmptyState description="Course vanished into thin air." />
  }

  const schedules = course?.schedules || []
  const roster = rosterQuery.data?.data ?? []
  const rosterMeta = rosterQuery.data?.pagination

  const detailList = [
    { icon: BookOpen, label: 'Course code', value: course?.code },
    { icon: Users, label: 'Enrolled', value: `${course?._count?.enrollments ?? 0} students` },
    {
      icon: CalendarRange,
      label: 'Lecturer',
      value: `${course?.lecturer?.firstName || ''} ${course?.lecturer?.lastName || ''}`.trim()
    }
  ]

  return (
    <div className="space-y-8">
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
        type="button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </button>

      <div className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-soft">
  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">{course?.department}</p>
  <h1 className="mt-3 text-3xl font-semibold text-slate-900">{course?.name}</h1>
  {course?.description ? <p className="mt-2 text-base text-slate-600">{course.description}</p> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {detailList.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/60 bg-white/70 p-4 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-2 text-brand-600">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              <p className="mt-2 text-base text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Schedules</h2>
          {canManageSchedule && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Schedule
            </button>
          )}
        </div>
        {schedules.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {schedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} onUpdate={courseQuery.refetch} />
            ))}
          </div>
        ) : (
          <EmptyState description="No sessions lined up yet." />
        )}
      </section>

      {canSeeRoster ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Roster</h2>
          {rosterQuery.isLoading ? (
            <Loader label="Pulling roster" />
          ) : roster.length ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-white/80">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="bg-brand-50 text-brand-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Student ID</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {roster.map((student) => (
                    <tr key={student.id} className="bg-white/70 text-slate-600">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-4 py-3">{student.studentId || '—'}</td>
                      <td className="px-4 py-3">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rosterMeta ? (
                <div className="border-t border-border/70 bg-white/80 px-4 py-3 text-xs text-slate-400">
                  Page {rosterMeta.page} of {rosterMeta.pages} · {rosterMeta.total} students
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState description="No students enrolled. Yet." />
          )}
        </section>
      ) : null}

      {isScheduleModalOpen && (
        <Modal
          title={`Schedule Lecture for ${course?.code}`}
          onClose={() => setIsScheduleModalOpen(false)}
        >
          <ScheduleForm
            courses={[course]} // Pre-select current course
            venues={venuesQuery.data?.data || []}
            onSubmit={handleCreateSchedule}
            onCancel={() => setIsScheduleModalOpen(false)}
            isLoading={createScheduleMutation.isLoading}
          />
        </Modal>
      )}
    </div>
  )
}
