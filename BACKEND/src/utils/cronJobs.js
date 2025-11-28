/**
 * Cron Jobs for automated tasks
 */

const { updateVenueStatuses } = require('./venueOccupancy');
const { PrismaClient } = require('@prisma/client');
const Expo = require('expo-server-sdk').Expo;

// Initialize Prisma Client and Expo SDK
const prisma = new PrismaClient();
const expo = new Expo();

// Store io instance for socket emissions
let ioInstance = null;

/**
 * Set the Socket.IO instance for notifications
 */
function setSocketIO(io) {
  ioInstance = io;
}

/**
 * Generate automated reminders for upcoming classes
 */
async function generateAutomatedReminders(hoursBefore = 24, daysAhead = 7) {
  try {
    // Get current date and time
    const now = new Date();
    
    // Get current day of week (0-6, where 0 is Sunday)
    const currentDayOfWeek = now.getDay();
    
    // Get all schedules with enrollments
    const upcomingSchedules = await prisma.schedule.findMany({
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
      
      // Only create reminders if the reminder time is in the future and within the next hour
      if (reminderTime > now) {
        // Create notifications for each enrolled student
        for (const enrollment of schedule.course.enrollments) {
          const student = enrollment.student;
          
          // Check if reminder already exists to avoid duplicates
          const existingReminder = await prisma.notification.findFirst({
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
            await prisma.notification.create({
              data: {
                userId: student.id,
                type: 'SCHEDULE_REMINDER',
                message: `Reminder: ${schedule.course.name} class on ${schedule.dayOfWeek} at ${schedule.startTime} in ${schedule.venue.name}`,
                link: `/schedules/${schedule.id}`
              }
            });
            
            remindersCreated++;
            
            // Send real-time notification via Socket.IO if available
            if (ioInstance) {
              ioInstance.to(`user:${student.id}`).emit('notification', {
                type: 'SCHEDULE_REMINDER',
                message: `Reminder: ${schedule.course.name} class on ${schedule.dayOfWeek} at ${schedule.startTime}`,
                link: `/schedules/${schedule.id}`
              });
            }
            
            // Send push notification if student has a push token
            if (student.pushToken && Expo.isExpoPushToken(student.pushToken)) {
              try {
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
              } catch (pushError) {
                console.error('Error sending push notification:', pushError);
              }
            }
          }
        }
      }
    }

    if (remindersCreated > 0 || notificationsSent > 0) {
      console.log(`Automated reminders: Created ${remindersCreated} reminders and sent ${notificationsSent} push notifications`);
    }
    
    return { remindersCreated, notificationsSent };
  } catch (error) {
    console.error('Error generating automated reminders:', error);
    return { remindersCreated: 0, notificationsSent: 0 };
  }
}

/**
 * Start all cron jobs
 */
function startCronJobs(io) {
  // Set the Socket.IO instance for notifications
  if (io) {
    setSocketIO(io);
  }
  
  // Update venue statuses every minute
  setInterval(async () => {
    try {
      await updateVenueStatuses();
    } catch (error) {
      console.error('Error updating venue statuses:', error);
    }
  }, 60000); // Run every 60 seconds

  // Generate automated reminders every hour
  setInterval(async () => {
    try {
      await generateAutomatedReminders(24, 7); // 24 hours before, 7 days ahead
    } catch (error) {
      console.error('Error generating automated reminders:', error);
    }
  }, 3600000); // Run every hour (3600000 ms)

  console.log('Cron jobs started: Venue status updates running every minute, automated reminders running every hour');
}

module.exports = {
  startCronJobs,
  generateAutomatedReminders,
  setSocketIO
};
