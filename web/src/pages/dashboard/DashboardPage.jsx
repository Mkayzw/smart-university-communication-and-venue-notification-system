import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiQuery, useApiMutation } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { MetricCard } from '../../components/cards/MetricCard.jsx'
import { AnnouncementCard } from '../../components/cards/AnnouncementCard.jsx'
import { CourseCard } from '../../components/cards/CourseCard.jsx'
import { ScheduleCard } from '../../components/cards/ScheduleCard.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'

export const DashboardPage = () => {
  const { user } = useAuth()
  const [reminderMessage, setReminderMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const announcementsQuery = useApiQuery('/announcements', {
    params: { limit: 4, page: 1 }
  })

  const coursesQuery = useApiQuery(user?.role === 'ADMIN' ? '/courses' : '/courses/my', {
    params: { limit: 4, page: 1 }
  })

  const scheduleQuery = useApiQuery('/schedules/my-schedule', {
    params: { limit: 4, page: 1 }
  })

  const generateRemindersMutation = useApiMutation('/notifications/generate-reminders', {
    method: 'POST',
    onSuccess: (response) => {
      const { remindersCreated, notificationsSent, schedulesProcessed } = response?.data || {}
      setReminderMessage(`Successfully generated ${remindersCreated} reminders and sent ${notificationsSent} push notifications for ${schedulesProcessed} schedules.`)
      setIsGenerating(false)
    },
    onError: (error) => {
      setReminderMessage(`Error generating reminders: ${error?.message || 'Unknown error'}`)
      setIsGenerating(false)
    }
  })

  const handleGenerateReminders = () => {
    setIsGenerating(true)
    setReminderMessage('')
    generateRemindersMutation.mutate({
      hoursBefore: 24,
      daysAhead: 7
    })
  }

  const metrics = useMemo(() => {
    const totalAnnouncements = announcementsQuery.data?.pagination?.total ?? announcementsQuery.data?.data?.length ?? 0
    const totalCourses = coursesQuery.data?.pagination?.total ?? coursesQuery.data?.data?.length ?? 0
    const nextScheduleCount = scheduleQuery.data?.pagination?.total ?? scheduleQuery.data?.data?.length ?? 0

    return [
      { label: 'Announcements', value: totalAnnouncements, tone: 'brand' },
      { label: user?.role === 'ADMIN' ? 'All Courses' : 'My Courses', value: totalCourses, tone: 'accent' },
      { label: 'Upcoming Sessions', value: nextScheduleCount, tone: 'neutral' }
    ]
  }, [announcementsQuery.data, coursesQuery.data, scheduleQuery.data])

  return (
    <div className="space-y-8">
      {/* Admin & Lecturer Section - Visible to admins and lecturers */}
      {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
        <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {user?.role === 'ADMIN' ? 'Admin Controls' : 'Lecturer Tools'}
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-800">Generate Schedule Reminders</h3>
                <p className="text-sm text-slate-600">
                  {user?.role === 'ADMIN'
                    ? 'Create reminder notifications for all students\' upcoming classes (24 hours before, 7 days ahead)'
                    : 'Create reminder notifications for your students\' upcoming classes (24 hours before, 7 days ahead)'
                  }
                </p>
              </div>
              <button
                onClick={handleGenerateReminders}
                disabled={isGenerating || generateRemindersMutation.isLoading}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating || generateRemindersMutation.isLoading ? 'Generating...' : 'Generate Reminders'}
              </button>
            </div>
            {reminderMessage && (
              <div className={`p-3 rounded-md text-sm ${reminderMessage.includes('Error') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                {reminderMessage}
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest Announcements</h2>
            <Link className="text-sm font-semibold text-brand-600" to="/announcements">
              View all
            </Link>
          </div>
          {announcementsQuery.isLoading ? (
            <Loader label="Fetching announcements" />
          ) : announcementsQuery.data?.data?.length ? (
            <div className="grid gap-4">
              {announcementsQuery.data.data.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <EmptyState description="When the lecturers speak up, you'll see it here." />
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Schedule</h2>
            <Link className="text-sm font-semibold text-brand-600" to="/schedules">
              See calendar
            </Link>
          </div>
          {scheduleQuery.isLoading ? (
            <Loader label="Checking timetables" />
          ) : scheduleQuery.data?.data?.length ? (
            <div className="grid gap-4">
              {scheduleQuery.data.data.map((entry) => (
                <ScheduleCard key={entry.id} schedule={entry} />
              ))}
            </div>
          ) : (
            <EmptyState description="Apparently nothing scheduled. Enjoy the calm." />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{user?.role === 'ADMIN' ? 'All Courses' : 'My Courses'}</h2>
          <Link className="text-sm font-semibold text-brand-600" to="/courses">
            {user?.role === 'ADMIN' ? 'Manage all courses' : 'Manage courses'}
          </Link>
        </div>
        {coursesQuery.isLoading ? (
          <Loader label="Loading courses" />
        ) : coursesQuery.data?.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coursesQuery.data.data.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState description="Grab a course and let's make your calendar busy again." />
        )}
      </section>
    </div>
  )
}
