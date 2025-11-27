const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = {};

    if (req.user.role === 'ADMIN') {
      const [totalUsers, totalCourses, totalVenues, activeSchedules] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.venue.count(),
        prisma.schedule.count()
      ]);

      stats.totalUsers = totalUsers;
      stats.totalCourses = totalCourses;
      stats.totalVenues = totalVenues;
      stats.activeSchedules = activeSchedules;
    } else if (req.user.role === 'LECTURER') {
      const [myCourses, mySchedules, totalStudents] = await Promise.all([
        prisma.course.count({ where: { lecturerId: req.user.id } }),
        prisma.schedule.count({ where: { course: { lecturerId: req.user.id } } }),
        prisma.enrollment.count({ where: { course: { lecturerId: req.user.id } } })
      ]);

      stats.myCourses = myCourses;
      stats.mySchedules = mySchedules;
      stats.totalStudents = totalStudents;
    } else if (req.user.role === 'STUDENT') {
      const [enrolledCourses, upcomingClasses, unreadNotifications] = await Promise.all([
        prisma.enrollment.count({ where: { studentId: req.user.id } }),
        prisma.schedule.count({ 
          where: { 
            course: { 
              enrollments: { 
                some: { studentId: req.user.id } 
              } 
            } 
          } 
        }),
        prisma.notification.count({ 
          where: { 
            userId: req.user.id,
            read: false 
          } 
        })
      ]);

      stats.enrolledCourses = enrolledCourses;
      stats.upcomingClasses = upcomingClasses;
      stats.unreadNotifications = unreadNotifications;
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};