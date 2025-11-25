import { useState } from 'react'
import { BookOpen, GraduationCap } from 'lucide-react'
import { CourseCard } from '../../components/cards/CourseCard.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { useApiQuery } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'

export const MyCoursesPage = () => {
  const { user } = useAuth()
  const [page, setPage] = useState(1)

  const myCoursesQuery = useApiQuery('/courses/my', {
    params: { page, limit: 12 }
  })

  if (myCoursesQuery.isLoading) {
    return <Loader label="Loading your courses" />
  }

  const coursesData = myCoursesQuery.data?.data || []
  const pagination = myCoursesQuery.data?.pagination

  // Transform data based on role
  const courses = user?.role === 'STUDENT' 
    ? coursesData.map(item => item.course)
    : coursesData

  const subtitle = user?.role === 'LECTURER' 
    ? 'Courses you are teaching'
    : user?.role === 'STUDENT'
    ? 'Courses you are enrolled in'
    : 'All courses in the system'

  return (
    <div>
      <PageHeader 
        title="My Courses" 
        subtitle={subtitle}
      />

      {courses.length === 0 ? (
        <EmptyState 
          icon={user?.role === 'LECTURER' ? GraduationCap : BookOpen}
          description={
            user?.role === 'LECTURER' 
              ? "You're not teaching any courses yet." 
              : "You haven't enrolled in any courses yet. Go to the Courses page to enroll!"
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onUpdate={myCoursesQuery.refetch}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm font-medium text-slate-600">
                Page {page} of {pagination.pages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-xl border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-linear-to-br from-brand-50 to-white p-4 shadow-soft">
              <p className="text-sm font-medium text-slate-600">
                {user?.role === 'LECTURER' ? 'Teaching' : 'Enrolled In'}
              </p>
              <p className="mt-1 text-3xl font-bold text-brand-700">{pagination?.total || 0}</p>
              <p className="mt-1 text-xs text-slate-500">
                {pagination?.total === 1 ? 'course' : 'courses'}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-linear-to-br from-blue-50 to-white p-4 shadow-soft">
              <p className="text-sm font-medium text-slate-600">
                {user?.role === 'LECTURER' ? 'Total Students' : 'Current Page'}
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {user?.role === 'LECTURER' 
                  ? courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)
                  : courses.length
                }
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {user?.role === 'LECTURER' ? 'enrolled' : 'on this page'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
