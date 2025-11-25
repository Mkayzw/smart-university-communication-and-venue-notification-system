import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { useApiQuery } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export const MySchedulePage = () => {
  const { user } = useAuth()
  const schedulesQuery = useApiQuery('/schedules/my-schedule')

  if (schedulesQuery.isLoading) {
    return <Loader label="Loading your schedule" />
  }

  const schedules = schedulesQuery.data?.data || schedulesQuery.data || []

  // Group schedules by day of week
  const schedulesByDay = DAYS.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.dayOfWeek === day)
    return acc
  }, {})

  const subtitle = user?.role === 'LECTURER' 
    ? 'Your teaching schedule for the week' 
    : 'Your class schedule for the week'

  return (
    <div>
      <PageHeader 
        title="My Schedule" 
        subtitle={subtitle}
      />

      {schedules.length === 0 ? (
        <EmptyState 
          icon={Calendar}
          description={
            user?.role === 'LECTURER' 
              ? "You're not teaching any courses yet." 
              : "You haven't enrolled in any courses yet."
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Weekly Timetable View */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {DAYS.map((day) => {
              const daySchedules = schedulesByDay[day]
              const hasSchedules = daySchedules.length > 0

              return (
                <div
                  key={day}
                  className={`rounded-3xl border border-border/70 p-5 shadow-soft ${
                    hasSchedules ? 'bg-white/80' : 'bg-white/40'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </h3>
                    {hasSchedules && (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  {hasSchedules ? (
                    <div className="space-y-3">
                      {daySchedules
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((schedule) => (
                          <div
                            key={schedule.id}
                            className="group rounded-2xl border border-border/60 bg-linear-to-br from-white/90 to-white/50 p-4 shadow-inner transition-all hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                                  {schedule.course?.code}
                                </p>
                                <h4 className="mt-1 text-sm font-semibold text-slate-900 leading-tight">
                                  {schedule.course?.name}
                                </h4>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-brand-500" />
                                <span className="font-medium">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{schedule.venue?.name || 'TBA'}</span>
                              </div>

                              {user?.role === 'STUDENT' && schedule.lecturer && (
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  <span>
                                    {schedule.lecturer.firstName} {schedule.lecturer.lastName}
                                  </span>
                                </div>
                              )}

                              {schedule.semester && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                    Semester {schedule.semester}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400">No classes</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary Statistics */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-linear-to-br from-brand-50 to-white p-4 shadow-soft">
              <p className="text-sm font-medium text-slate-600">Total Classes</p>
              <p className="mt-1 text-3xl font-bold text-brand-700">{schedules.length}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-linear-to-br from-blue-50 to-white p-4 shadow-soft">
              <p className="text-sm font-medium text-slate-600">
                {user?.role === 'LECTURER' ? 'Teaching Days' : 'Class Days'}
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {Object.values(schedulesByDay).filter((s) => s.length > 0).length}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-linear-to-br from-slate-50 to-white p-4 shadow-soft">
              <p className="text-sm font-medium text-slate-600">
                {user?.role === 'LECTURER' ? 'Courses Teaching' : 'Courses Enrolled'}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-700">
                {new Set(schedules.map((s) => s.courseId)).size}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
