import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApiQuery } from '../../hooks/useApi.js'
import { MetricCard } from '../../components/cards/MetricCard.jsx'
import { AnnouncementCard } from '../../components/cards/AnnouncementCard.jsx'
import { CourseCard } from '../../components/cards/CourseCard.jsx'
import { ScheduleCard } from '../../components/cards/ScheduleCard.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'

export const DashboardPage = () => {
  const announcementsQuery = useApiQuery('/announcements', {
    params: { limit: 4, page: 1 }
  })

  const coursesQuery = useApiQuery('/courses/my', {
    params: { limit: 4, page: 1 }
  })

  const scheduleQuery = useApiQuery('/schedules/my-schedule', {
    params: { limit: 4, page: 1 }
  })

  const metrics = useMemo(() => {
    const totalAnnouncements = announcementsQuery.data?.pagination?.total ?? announcementsQuery.data?.data?.length ?? 0
    const totalCourses = coursesQuery.data?.pagination?.total ?? coursesQuery.data?.data?.length ?? 0
    const nextScheduleCount = scheduleQuery.data?.pagination?.total ?? scheduleQuery.data?.data?.length ?? 0

    return [
      { label: 'Announcements', value: totalAnnouncements, tone: 'brand' },
      { label: 'My Courses', value: totalCourses, tone: 'accent' },
      { label: 'Upcoming Sessions', value: nextScheduleCount, tone: 'neutral' }
    ]
  }, [announcementsQuery.data, coursesQuery.data, scheduleQuery.data])

  return (
    <div className="space-y-8">
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
          <h2 className="text-lg font-semibold text-slate-900">My Courses</h2>
          <Link className="text-sm font-semibold text-brand-600" to="/courses">
            Manage courses
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
