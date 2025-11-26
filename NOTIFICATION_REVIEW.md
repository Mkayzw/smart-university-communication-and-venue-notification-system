# Notification System Review

## Current Implementation Analysis

### ✅ What Works

1. **Database Schema**
   - `Notification` model properly defined with:
     - `id`, `userId`, `type`, `message`, `link`, `read`, `createdAt`
     - Proper indexes: `[userId, read]`, `[userId, createdAt]`, `[type]`
     - Cascade delete on user deletion

2. **API Endpoints**
   - ✅ `GET /api/notifications` - Get user notifications
   - ✅ `PATCH /api/notifications/:id/read` - Mark single notification as read
   - ✅ `PUT /api/notifications/read/all` - Mark all as read
   - ✅ `POST /api/notifications/push-token` - Register push token

3. **Socket.IO Integration**
   - ✅ Real-time notifications via Socket.IO
   - ✅ User-specific rooms (`user:${userId}`)
   - ✅ Role-based rooms (`role:${role}`)
   - ✅ Course-based rooms (`course:${courseId}`)

4. **Push Notifications**
   - ✅ Expo SDK initialized
   - ✅ Push token registration endpoint
   - ✅ Push notifications sent for HIGH/URGENT announcements

### ❌ Issues Found

1. **Missing Notification Creation**
   - ❌ **Schedule Creation**: No notifications sent to enrolled students
   - ❌ **Schedule Update**: No notifications sent to enrolled students
   - ❌ **Schedule Deletion**: No notifications sent
   - ❌ **Announcement Creation**: Only push notifications for HIGH/URGENT, no database notifications
   - ❌ **Course Enrollment**: No notification when student enrolls
   - ❌ **Venue Status Change**: No notifications when venue goes to maintenance

2. **Notification Service Not Used**
   - `notificationService.js` exists but is NOT imported in `app.js`
   - Functions like `notifyCourseStudents()` and `createNotification()` are not being called

3. **Missing Features**
   - ❌ No notification filtering (by type, unread only)
   - ❌ No pagination for notifications
   - ❌ No notification deletion endpoint
   - ❌ No notification count endpoint
   - ❌ No bulk notification creation endpoint

4. **Incomplete Implementation**
   - Announcements only send push notifications, not database notifications
   - No real-time Socket.IO emission when notifications are created
   - Missing notification types for various events

## Notification Flow Analysis

### Current Flow (Broken)
```
Event (Schedule Created) 
  → Socket.IO Event Emitted
  → ❌ NO Database Notification Created
  → ❌ NO Notification Sent to Students
```

### Expected Flow
```
Event (Schedule Created)
  → Create Database Notifications for Enrolled Students
  → Emit Socket.IO Event to Affected Users
  → Send Push Notifications (if tokens exist)
```

## Notification Types Needed

1. **SCHEDULE_CREATED** - When new schedule is created
2. **SCHEDULE_UPDATED** - When schedule is modified
3. **SCHEDULE_DELETED** - When schedule is cancelled
4. **NEW_ANNOUNCEMENT** - When announcement is created
5. **ANNOUNCEMENT_UPDATED** - When announcement is updated
6. **COURSE_ENROLLED** - When student enrolls in course
7. **VENUE_MAINTENANCE** - When venue goes under maintenance
8. **VENUE_AVAILABLE** - When venue becomes available again
9. **COURSE_ASSIGNED** - When lecturer is assigned to course
10. **SYSTEM** - System-wide notifications

## Recommendations

### High Priority Fixes

1. **Import and Use Notification Service**
   - Import `notificationService.js` in `app.js`
   - Call `notifyCourseStudents()` when schedules are created/updated/deleted
   - Call `createNotification()` for announcements

2. **Add Notification Creation Points**
   - Schedule creation → notify enrolled students
   - Schedule update → notify enrolled students
   - Schedule deletion → notify enrolled students
   - Announcement creation → notify target audience
   - Venue status change → notify affected users

3. **Add Missing Endpoints**
   - `GET /api/notifications/unread` - Get unread count
   - `GET /api/notifications?unreadOnly=true` - Filter unread
   - `GET /api/notifications?type=SCHEDULE_CREATED` - Filter by type
   - `DELETE /api/notifications/:id` - Delete notification

4. **Improve Socket.IO Integration**
   - Emit notifications when created
   - Send to specific users, not broadcast to all

### Medium Priority Improvements

1. **Add Pagination**
   - Limit notifications per page
   - Add pagination metadata

2. **Add Notification Preferences**
   - Allow users to disable certain notification types
   - Store preferences in database

3. **Add Notification Templates**
   - Standardize notification messages
   - Support variables in messages

4. **Add Notification History**
   - Keep read notifications for X days
   - Auto-delete old notifications

### Low Priority Enhancements

1. **Notification Groups**
   - Group related notifications
   - Batch notifications

2. **Notification Actions**
   - Add action buttons to notifications
   - Deep linking support

3. **Notification Analytics**
   - Track notification open rates
   - Track notification effectiveness

## Implementation Plan

1. ✅ Import notificationService.js
2. ✅ Add notification creation in schedule endpoints
3. ✅ Add notification creation in announcement endpoint
4. ✅ Add notification filtering and pagination
5. ✅ Add missing endpoints
6. ✅ Test notification flow
7. ✅ Update frontend to handle new notification types

