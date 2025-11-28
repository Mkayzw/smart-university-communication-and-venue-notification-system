const { AppError } = require('../utils/errorHandler');
let Expo;

try {
  Expo = require('expo-server-sdk').Expo;
} catch (error) {
  console.error('Failed to load expo-server-sdk:', error);
  Expo = null;
}

// Get user notifications
const getNotifications = async (req, res, next) => {
  try {
    console.log('Getting notifications for user:', req.user.id);
    const { unreadOnly, type, page = 1, limit = 50 } = req.query;
    
    const where = { userId: req.user.id };
    
    if (unreadOnly === 'true') {
      where.read = false;
    }
    
    if (type) {
      where.type = type;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get all notifications first
    const [allNotifications, total] = await Promise.all([
      req.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.notification.count({ where })
    ]);

    console.log(`Found ${allNotifications.length} notifications for user ${req.user.id}`);

    // Filter notifications based on course enrollment for students
    let filteredNotifications = allNotifications;
    
    if (req.user.role === 'STUDENT') {
      try {
        // Get student's enrolled courses
        const enrollments = await req.prisma.enrollment.findMany({
          where: { studentId: req.user.id },
          select: { courseId: true }
        });
        const enrolledCourseIds = enrollments.map(e => e.courseId);

        // Get all schedule notifications and their course IDs in one query
        const scheduleNotifications = allNotifications.filter(n => n.link && n.link.includes('/schedules/'));
        const scheduleIds = scheduleNotifications.map(n => {
          const match = n.link.match(/\/schedules\/([^\/\?]+)/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        const schedules = await req.prisma.schedule.findMany({
          where: { id: { in: scheduleIds } },
          select: { id: true, courseId: true }
        });
        
        const scheduleToCourseMap = Object.fromEntries(
          schedules.map(s => [s.id, s.courseId])
        );

        // Filter notifications
        filteredNotifications = allNotifications.filter(notification => {
          // Allow non-course related notifications (announcements, system, etc.)
          if (!notification.link || (!notification.link.includes('/courses/') && !notification.link.includes('/schedules/') && !notification.link.includes('/announcements/'))) {
            return true;
          }
          
          // Always allow announcement notifications
          if (notification.link.includes('/announcements/') || notification.type === 'NEW_ANNOUNCEMENT') {
            return true;
          }
          
          // For course-related notifications via /courses/ link
          if (notification.link.includes('/courses/')) {
            const courseIdMatch = notification.link.match(/\/courses\/([^\/\?]+)/);
            if (courseIdMatch) {
              const courseId = courseIdMatch[1];
              return enrolledCourseIds.includes(courseId);
            }
          }
          
          // For schedule notifications via /schedules/ link - use pre-fetched map
          if (notification.link.includes('/schedules/')) {
            const scheduleIdMatch = notification.link.match(/\/schedules\/([^\/\?]+)/);
            if (scheduleIdMatch) {
              const scheduleId = scheduleIdMatch[1];
              const courseId = scheduleToCourseMap[scheduleId];
              return courseId && enrolledCourseIds.includes(courseId);
            }
          }
          
          // Debug: Log any notifications that don't match patterns
          console.log(`Notification filtering debug for user ${req.user.id}:`, {
            type: notification.type,
            link: notification.link,
            message: notification.message,
            allowed: false
          });
          
          return false;
        });
      } catch (filterError) {
        console.error('Error filtering notifications for student:', filterError);
        filteredNotifications = allNotifications; // Return all notifications if filtering fails
      }
    }

    console.log(`Returning ${filteredNotifications.length} filtered notifications for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: filteredNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredNotifications.length,
        pages: Math.ceil(filteredNotifications.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    next(error);
  }
};

// Get unread notification count
const getUnreadCount = async (req, res, next) => {
  try {
    console.log('Getting unread count for user:', req.user.id);
    // Get all unread notifications first
    const allUnreadNotifications = await req.prisma.notification.findMany({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    console.log(`Found ${allUnreadNotifications.length} unread notifications for user ${req.user.id}`);

    // Filter notifications based on course enrollment for students
    let filteredNotifications = allUnreadNotifications;
    
    if (req.user.role === 'STUDENT') {
      try {
        // Get student's enrolled courses
        const enrollments = await req.prisma.enrollment.findMany({
          where: { studentId: req.user.id },
          select: { courseId: true }
        });
        const enrolledCourseIds = enrollments.map(e => e.courseId);

        // Get all schedule notifications and their course IDs in one query
        const scheduleNotifications = allUnreadNotifications.filter(n => n.link && n.link.includes('/schedules/'));
        const scheduleIds = scheduleNotifications.map(n => {
          const match = n.link.match(/\/schedules\/([^\/\?]+)/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        const schedules = await req.prisma.schedule.findMany({
          where: { id: { in: scheduleIds } },
          select: { id: true, courseId: true }
        });
        
        const scheduleToCourseMap = Object.fromEntries(
          schedules.map(s => [s.id, s.courseId])
        );

        // Filter notifications
        filteredNotifications = allUnreadNotifications.filter(notification => {
          // Allow non-course related notifications (announcements, system, etc.)
          if (!notification.link || (!notification.link.includes('/courses/') && !notification.link.includes('/schedules/') && !notification.link.includes('/announcements/'))) {
            return true;
          }
          
          // Always allow announcement notifications
          if (notification.link.includes('/announcements/') || notification.type === 'NEW_ANNOUNCEMENT') {
            return true;
          }
          
          // For course-related notifications via /courses/ link
          if (notification.link.includes('/courses/')) {
            const courseIdMatch = notification.link.match(/\/courses\/([^\/\?]+)/);
            if (courseIdMatch) {
              const courseId = courseIdMatch[1];
              return enrolledCourseIds.includes(courseId);
            }
          }
          
          // For schedule notifications via /schedules/ link - use pre-fetched map
          if (notification.link.includes('/schedules/')) {
            const scheduleIdMatch = notification.link.match(/\/schedules\/([^\/\?]+)/);
            if (scheduleIdMatch) {
              const scheduleId = scheduleIdMatch[1];
              const courseId = scheduleToCourseMap[scheduleId];
              return courseId && enrolledCourseIds.includes(courseId);
            }
          }
          
          // Debug: Log any notifications that don't match patterns
          console.log(`Unread notification filtering debug for user ${req.user.id}:`, {
            type: notification.type,
            link: notification.link,
            message: notification.message,
            allowed: false
          });
          
          return false;
        });
      } catch (filterError) {
        console.error('Error filtering unread notifications for student:', filterError);
        filteredNotifications = allUnreadNotifications; // Return all notifications if filtering fails
      }
    }

    console.log(`Returning ${filteredNotifications.length} unread notifications for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: { count: filteredNotifications.length }
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await req.prisma.notification.update({
      where: {
        id,
        userId: req.user.id
      },
      data: {
        read: true
      }
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    await req.prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await req.prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    if (notification.userId !== req.user.id) {
      return next(new AppError('Not authorized to delete this notification', 403));
    }

    await req.prisma.notification.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Register push token
const registerPushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!Expo) {
      console.warn('Expo SDK not available, skipping push token validation');
      await req.prisma.user.update({
        where: { id: req.user.id },
        data: { pushToken }
      });

      res.status(200).json({
        success: true,
        message: 'Push token registered successfully (without validation)'
      });
      return;
    }

    const expo = new Expo();

    if (!Expo.isExpoPushToken(pushToken)) {
      return next(new AppError('Invalid push token', 400));
    }

    await req.prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken }
    });

    res.status(200).json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Generate automated reminders for upcoming classes (Admin only)
const generateReminders = async (req, res, next) => {
  try {
    const { hoursBefore = 24, daysAhead = 7 } = req.body;
    
    // Get current date and time
    const now = new Date();
    const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    // Get current day of week (0-6, where 0 is Sunday)
    const currentDayOfWeek = now.getDay();
    
    // Get all schedules for the next few days
    const upcomingSchedules = await req.prisma.schedule.findMany({
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    pushToken: true
                  }
                }
              }
            }
          }
        },
        venue: true
      }
    });

    // Filter schedules that are within the time window and match current day
    const relevantSchedules = upcomingSchedules.filter(schedule => {
      // Convert day names to numbers (0-6)
      const dayMap = {
        'SUNDAY': 0,
        'MONDAY': 1,
        'TUESDAY': 2,
        'WEDNESDAY': 3,
        'THURSDAY': 4,
        'FRIDAY': 5,
        'SATURDAY': 6
      };
      
      const scheduleDay = dayMap[schedule.dayOfWeek];
      
      // Check if this schedule occurs in the next few days
      const daysUntilSchedule = (scheduleDay - currentDayOfWeek + 7) % 7;
      
      return daysUntilSchedule <= daysAhead && daysUntilSchedule >= 0;
    });

    let remindersCreated = 0;
    let notificationsSent = 0;

    // Process each relevant schedule
    for (const schedule of relevantSchedules) {
      // Calculate days until this schedule
      const dayMap = {
        'SUNDAY': 0,
        'MONDAY': 1,
        'TUESDAY': 2,
        'WEDNESDAY': 3,
        'THURSDAY': 4,
        'FRIDAY': 5,
        'SATURDAY': 6
      };
      
      const scheduleDay = dayMap[schedule.dayOfWeek];
      const daysUntilSchedule = (scheduleDay - currentDayOfWeek + 7) % 7;
      
      // Calculate the exact date and time of the schedule
      const scheduleDate = new Date(now.getTime() + (daysUntilSchedule * 24 * 60 * 60 * 1000));
      const [hours, minutes] = schedule.startTime.split(':');
      scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Calculate reminder time (hours before the schedule)
      const reminderTime = new Date(scheduleDate.getTime() - (hoursBefore * 60 * 60 * 1000));
      
      // Only create reminders if the reminder time is in the future
      if (reminderTime > now) {
        // Create notifications for each enrolled student
        for (const enrollment of schedule.course.enrollments) {
          const student = enrollment.student;
          
          // Check if reminder already exists to avoid duplicates
          const existingReminder = await req.prisma.notification.findFirst({
            where: {
              userId: student.id,
              type: 'SCHEDULE_REMINDER',
              link: `/schedules/${schedule.id}`,
              createdAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          });
          
          if (!existingReminder) {
            // Create database notification
            await req.prisma.notification.create({
              data: {
                userId: student.id,
                type: 'SCHEDULE_REMINDER',
                message: `Reminder: ${schedule.course.name} class on ${schedule.dayOfWeek} at ${schedule.startTime} in ${schedule.venue.name}`,
                link: `/schedules/${schedule.id}`
              }
            });
            
            remindersCreated++;
            
            // Send real-time notification via Socket.IO
            const io = req.app.get('io');
            io.to(`user:${student.id}`).emit('notification', {
              type: 'SCHEDULE_REMINDER',
              message: `Reminder: ${schedule.course.name} class on ${schedule.dayOfWeek} at ${schedule.startTime}`,
              link: `/schedules/${schedule.id}`
            });
            
            // Send push notification if student has a push token
            if (student.pushToken && Expo) {
              try {
                const expo = new Expo();
                
                if (Expo.isExpoPushToken(student.pushToken)) {
                  await expo.sendPushNotificationsAsync([{
                    to: student.pushToken,
                    sound: 'default',
                    title: 'Class Reminder',
                    body: `${schedule.course.name} class on ${schedule.dayOfWeek} at ${schedule.startTime} in ${schedule.venue.name}`,
                    data: {
                      type: 'SCHEDULE_REMINDER',
                      scheduleId: schedule.id
                    }
                  }]);
                  notificationsSent++;
                }
              } catch (pushError) {
                console.error('Error sending push notification:', pushError);
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${remindersCreated} reminders and sent ${notificationsSent} push notifications for upcoming classes`,
      data: {
        remindersCreated,
        notificationsSent,
        schedulesProcessed: relevantSchedules.length
      }
    });
  } catch (error) {
    console.error('Error generating reminders:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
  generateReminders
};