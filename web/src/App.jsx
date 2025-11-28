// Import routing components
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
// Import authentication hook
import { useAuth } from './hooks/useAuth.js'
// Import layout components
import { DashboardLayout } from './components/layout/DashboardLayout.jsx'
// Import page components
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
// Import utility components
import { SplashScreen } from './components/feedback/SplashScreen.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ErrorProvider } from './providers/ErrorProvider.jsx'

// Route wrapper for authenticated users with optional role-based access
const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <SplashScreen label="Booting up your campus hub" />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if roles are specified
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  // Render child routes if all checks pass
  return <Outlet />
}

// Route wrapper for public routes (accessible only when not authenticated)
const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <SplashScreen label="Hang tight" />
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Render child routes if not authenticated
  return <Outlet />
}

// Main application component with routing configuration
export default function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes - only accessible when not authenticated */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes - require authentication */}
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
                {/* Admin/Lecturer only routes */}
                <Route element={<ProtectedRoute roles={["ADMIN", "LECTURER"]} />}>
                  <Route path="venues" element={<VenuesPage />} />
                  <Route path="venues/:id" element={<VenueDetailPage />} />
                </Route>
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Catch-all route for undefined paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorProvider>
    </ErrorBoundary>
  )
}
