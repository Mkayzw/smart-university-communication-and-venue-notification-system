import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { DashboardLayout } from './components/layout/DashboardLayout.jsx'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx'
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage.jsx'
import { CoursesPage } from './pages/courses/CoursesPage.jsx'
import { MyCoursesPage } from './pages/courses/MyCoursesPage.jsx'
import { VenuesPage } from './pages/venues/VenuesPage.jsx'
import { VenueDetailPage } from './pages/venues/VenueDetailPage.jsx'
import { SchedulesPage } from './pages/schedules/SchedulesPage.jsx'
import { MySchedulePage } from './pages/schedules/MySchedulePage.jsx'
import { NotificationsPage } from './pages/notifications/NotificationsPage.jsx'
import { ProfilePage } from './pages/profile/ProfilePage.jsx'
import { CourseDetailPage } from './pages/courses/CourseDetailPage.jsx'
import { AnnouncementDetailPage } from './pages/announcements/AnnouncementDetailPage.jsx'
import { SplashScreen } from './components/feedback/SplashScreen.jsx'

const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <SplashScreen label="Booting up your campus hub" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <SplashScreen label="Hang tight" />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="my-courses" element={<MyCoursesPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="my-schedule" element={<MySchedulePage />} />
            <Route element={<ProtectedRoute roles={["ADMIN", "LECTURER"]} />}>
              <Route path="venues" element={<VenuesPage />} />
              <Route path="venues/:id" element={<VenueDetailPage />} />
            </Route>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
