# Backend Refactoring Guide

## Overview
This document outlines the refactoring of the Smart University Communication and Venue Notification System backend from a monolithic `app.js` file to a structured MVC (Model-View-Controller) architecture.

## Directory Structure

### New Structure
```
BACKEND/src/
├── controllers/          # Route handlers (Controllers)
│   ├── authController.js
│   ├── userController.js
│   ├── courseController.js
│   ├── announcementController.js
│   ├── scheduleController.js
│   ├── venueController.js
│   ├── notificationController.js
│   └── dashboardController.js
├── routes/              # Route definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── courseRoutes.js
│   ├── announcementRoutes.js
│   ├── scheduleRoutes.js
│   ├── venueRoutes.js
│   ├── notificationRoutes.js
│   └── dashboardRoutes.js
├── middleware/           # Authentication and authorization
│   ├── auth.js
│   └── role.js
├── services/            # Business logic and external services
│   ├── notificationService.js
│   └── [existing service directories]
├── utils/              # Utility functions
│   ├── errorHandler.js
│   ├── logger.js
│   ├── validator.js
│   └── venueOccupancy.js
├── config/             # Configuration files
│   ├── db.js
│   ├── security.js
│   └── swagger.json
├── socket/              # Socket.IO handlers
│   └── socketHandler.js
├── shared/              # Shared utilities
│   ├── socketEmitter.js
│   └── utils.js
├── app.js              # Main application file (refactored)
└── server.js            # Server startup file
```

## Refactored Modules

### 1. Authentication Module
- **Controller**: `authController.js`
  - `register()` - User registration with validation
  - `login()` - User authentication with JWT token generation
  - `getMe()` - Get current user profile
- **Routes**: `authRoutes.js`
  - POST `/api/auth/register` - Register new user
  - POST `/api/auth/login` - User login
  - GET `/api/auth/me` - Get current user

### 2. User Management Module
- **Controller**: `userController.js`
  - `getUsers()` - Get all users (Admin only)
  - `updateUser()` - Update user profile
  - `deleteUser()` - Delete user (Admin only)
- **Routes**: `userRoutes.js`
  - GET `/api/users` - Get users with pagination and filters
  - PUT `/api/users/:id` - Update user
  - DELETE `/api/users/:id` - Delete user

### 3. Course Management Module
- **Controller**: `courseController.js`
  - `getCourses()` - Get all courses with pagination
  - `getMyCourses()` - Get user's courses (enrolled/teaching)
  - `getDepartments()` - Get list of departments
  - `getCourse()` - Get single course with details
  - `createCourse()` - Create new course (Lecturer/Admin)
  - `enrollInCourse()` - Enroll in course (Student)
  - `dropCourse()` - Drop/Unenroll from course (Student)
  - `updateCourse()` - Update course details
  - `deleteCourse()` - Delete course (Admin only)
  - `getCourseStudents()` - Get enrolled students (Lecturer/Admin)
- **Routes**: `courseRoutes.js`
  - GET `/api/courses` - Get all courses
  - GET `/api/courses/my` - Get user's courses
  - GET `/api/courses/departments` - Get departments
  - GET `/api/courses/:id` - Get single course
  - POST `/api/courses` - Create course
  - POST `/api/courses/:id/enroll` - Enroll in course
  - DELETE `/api/courses/:id/enroll` - Drop course
  - PUT `/api/courses/:id` - Update course
  - DELETE `/api/courses/:id` - Delete course
  - GET `/api/courses/:id/students` - Get course students

### 4. Announcement Module
- **Controller**: `announcementController.js`
  - `getAnnouncements()` - Get all announcements with filters
  - `getAnnouncement()` - Get single announcement with comments
  - `createAnnouncement()` - Create announcement (Lecturer/Admin)
  - `updateAnnouncement()` - Update announcement (Author/Admin)
  - `deleteAnnouncement()` - Delete announcement (Author/Admin)
  - `addComment()` - Add comment to announcement
  - `deleteComment()` - Delete comment (Author/Admin)
- **Routes**: `announcementRoutes.js`
  - GET `/api/announcements` - Get announcements
  - GET `/api/announcements/:id` - Get single announcement
  - POST `/api/announcements` - Create announcement
  - PUT `/api/announcements/:id` - Update announcement
  - DELETE `/api/announcements/:id` - Delete announcement
  - POST `/api/announcements/:id/comments` - Add comment
  - DELETE `/api/announcements/comments/:id` - Delete comment

### 5. Schedule Module
- **Controller**: `scheduleController.js`
  - `getMySchedule()` - Get user's personal schedule
  - `getSchedules()` - Get all schedules with filters
  - `createSchedule()` - Create schedule (Lecturer/Admin)
  - `updateSchedule()` - Update schedule (Lecturer/Admin)
  - `deleteSchedule()` - Delete schedule (Lecturer/Admin)
- **Routes**: `scheduleRoutes.js`
  - GET `/api/schedules/my-schedule` - Get personal schedule
  - GET `/api/schedules` - Get all schedules
  - POST `/api/schedules` - Create schedule
  - PUT `/api/schedules/:id` - Update schedule
  - DELETE `/api/schedules/:id` - Delete schedule

### 6. Venue Module
- **Controller**: `venueController.js`
  - `getVenuesRealtime()` - Get venues with real-time occupancy
  - `getAvailableVenues()` - Get available venues for time slot
  - `getVenues()` - Get all venues with pagination
  - `getVenue()` - Get single venue with schedules
  - `createVenue()` - Create venue (Admin only)
  - `updateVenue()` - Update venue (Admin only)
  - `updateVenueAvailability()` - Update venue status (Admin only)
  - `deleteVenue()` - Delete venue (Admin only)
- **Routes**: `venueRoutes.js`
  - GET `/api/venues/realtime` - Get real-time venue status
  - GET `/api/venues/available` - Get available venues
  - GET `/api/venues` - Get all venues
  - GET `/api/venues/:id` - Get single venue
  - POST `/api/venues` - Create venue
  - PUT `/api/venues/:id` - Update venue
  - PATCH `/api/venues/:id/availability` - Update availability
  - DELETE `/api/venues/:id` - Delete venue

### 7. Notification Module
- **Controller**: `notificationController.js`
  - `getNotifications()` - Get user notifications with filtering
  - `getUnreadCount()` - Get unread notification count
  - `markAsRead()` - Mark notification as read
  - `markAllAsRead()` - Mark all notifications as read
  - `deleteNotification()` - Delete notification
  - `registerPushToken()` - Register push notification token
  - `generateReminders()` - Generate automated class reminders (Admin)
- **Routes**: `notificationRoutes.js`
  - GET `/api/notifications` - Get notifications
  - GET `/api/notifications/unread/count` - Get unread count
  - PATCH `/api/notifications/:id/read` - Mark as read
  - PUT `/api/notifications/read/all` - Mark all as read
  - DELETE `/api/notifications/:id` - Delete notification
  - POST `/api/notifications/push-token` - Register push token
  - POST `/api/notifications/generate-reminders` - Generate reminders

### 8. Dashboard Module
- **Controller**: `dashboardController.js`
  - `getDashboardStats()` - Get role-based dashboard statistics
- **Routes**: `dashboardRoutes.js`
  - GET `/api/dashboard/stats` - Get dashboard statistics

## Key Improvements

### 1. Separation of Concerns
- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints and middleware
- **Services**: Contain business logic
- **Utils**: Reusable utility functions

### 2. Code Organization
- Each module has its own controller and routes file
- Related functionality is grouped together
- Consistent naming conventions across files

### 3. Maintainability
- Easier to locate and modify specific functionality
- Reduced file sizes for better navigation
- Clear dependency management

### 4. Scalability
- Modular structure supports easy addition of new features
- Consistent patterns for new modules
- Better testability of individual components

## Middleware Usage

### Authentication Middleware
```javascript
const { authenticate } = require('../middleware/auth');
```
- Validates JWT tokens
- Attaches user to request object
- Used on protected routes

### Authorization Middleware
```javascript
const { authorize } = require('../middleware/auth');
```
- Role-based access control
- Usage: `authorize('ADMIN', 'LECTURER')`
- Protects admin/lecturer-only endpoints

## Error Handling

### Centralized Error Handling
- All controllers use try-catch blocks
- Errors passed to next() for centralized handling
- Consistent error response format

### Validation
- Input validation using `validator.js` utilities
- Required field validation
- Format validation (email, time, etc.)

## Database Operations

### Prisma Client
- Shared across controllers via request object
- Proper connection management
- Query optimization with includes and selects

## Socket.IO Integration

### Real-time Features
- Socket utilities available via `req.socketUtils`
- Event emission for announcements, schedules, venues
- Room-based notifications for targeted updates

## Testing Recommendations

### Unit Testing
- Test each controller function independently
- Mock database operations
- Validate error handling

### Integration Testing
- Test route endpoints
- Verify middleware functionality
- Test socket events

## Deployment Notes

### Environment Variables
- Ensure all required variables are set
- JWT_SECRET is mandatory
- Database connection string

### Performance Considerations
- Database query optimization
- Proper indexing on frequently queried fields
- Pagination for large datasets

## Migration Steps

### From Old to New Structure
1. ✅ Create controllers directory and files
2. ✅ Create routes directory and files
3. ✅ Refactor business logic into controllers
4. ✅ Update app.js to use new structure
5. ✅ Test all endpoints
6. ⏳ Update documentation
7. ⏳ Deploy and monitor

## Best Practices Followed

### 1. RESTful API Design
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URL structure
- Consistent response formats

### 2. Security
- Input validation and sanitization
- Role-based access control
- JWT token authentication

### 3. Performance
- Database query optimization
- Efficient pagination
- Minimal data transfer

### 4. Code Quality
- Consistent error handling
- Proper async/await usage
- Clear function and variable naming

## Future Enhancements

### 1. Caching Layer
- Redis for frequently accessed data
- Session management
- API response caching

### 2. Rate Limiting
- Endpoint-specific rate limits
- User-based throttling
- DDoS protection

### 3. Logging and Monitoring
- Structured logging
- Performance metrics
- Error tracking

### 4. API Versioning
- Versioned endpoints
- Backward compatibility
- Deprecation handling

## Conclusion

The refactoring successfully transformed a monolithic 2600+ line file into a modular, maintainable structure following MVC patterns. This improves:

- **Maintainability**: Easier to locate and modify code
- **Scalability**: Simple to add new features
- **Testing**: Better unit and integration test support
- **Collaboration**: Multiple developers can work on different modules
- **Performance**: Optimized database queries and reduced bundle size

The new structure provides a solid foundation for future development while maintaining all existing functionality.