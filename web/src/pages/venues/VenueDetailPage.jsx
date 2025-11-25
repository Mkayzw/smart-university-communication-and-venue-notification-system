import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, Wrench, Calendar, Clock } from 'lucide-react'
import { useApiQuery } from '../../hooks/useApi.js'
import { Loader } from '../../components/common/Loader.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export const VenueDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const venueQuery = useApiQuery(`/venues/${id}`)

  if (venueQuery.isLoading) {
    return <Loader label="Loading venue details" />
  }

  const venue = venueQuery.data?.data || venueQuery.data

  if (!venue) {
    return <EmptyState description="This venue vanished into thin air." />
  }

  // Group schedules by day of week
  const schedulesByDay = DAYS.reduce((acc, day) => {
    acc[day] = (venue.schedules || []).filter((s) => s.dayOfWeek === day)
    return acc
  }, {})

  const statusTone = {
    AVAILABLE: 'success',
    OCCUPIED: 'warning',
    MAINTENANCE: 'danger'
  }

  return (
    <div className="space-y-8">
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
        type="button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to venues
      </button>

      {/* Venue Info Card */}
      <div className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-900">{venue.name}</h1>
              <StatusPill tone={statusTone[venue.status]} label={venue.status} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {venue.building}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-linear-to-br from-blue-50 to-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Capacity</p>
                <p className="text-lg font-bold text-blue-700">{venue.capacity} people</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-linear-to-br from-brand-50 to-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                <Calendar className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Scheduled Sessions</p>
                <p className="text-lg font-bold text-brand-700">{venue.schedules?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {venue.facilities && venue.facilities.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Wrench className="h-4 w-4" />
              Facilities
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {venue.facilities.map((facility, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Schedule */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Weekly Schedule</h2>
        
        {venue.schedules?.length === 0 ? (
          <EmptyState 
            icon={Calendar}
            description="No classes scheduled for this venue yet." 
          />
        ) : (
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
                            className="rounded-2xl border border-border/60 bg-linear-to-br from-white/90 to-white/50 p-4 shadow-inner"
                          >
                            <div className="flex items-center gap-2 text-brand-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm font-semibold">
                                {schedule.startTime} - {schedule.endTime}
                              </span>
                            </div>

                            <div className="mt-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {schedule.course?.code}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {schedule.course?.name}
                              </p>
                            </div>

                            {schedule.lecturer && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-600">
                                  {schedule.lecturer.firstName} {schedule.lecturer.lastName}
                                </p>
                              </div>
                            )}

                            {schedule.semester && (
                              <div className="mt-2">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                  {schedule.semester}
                                </span>
                              </div>
                            )}
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
        )}
      </section>
    </div>
  )
}
