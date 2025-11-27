const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/errorHandler');
const { validateRequired, validateDayOfWeek, validateTimeRange, validateSemester } = require('../utils/validator');

const prisma = new PrismaClient();

// Get my personal schedule
const getMySchedule = async (req, res, next) => {
  try {
    const where = {};
    
    if (req.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        select: { courseId: true }
      });
      where.courseId = { in: enrollments.map(e => e.courseId) };
    } else if (req.user.role === 'LECTURER') {
      where.course = { lecturerId: req.user.id };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        venue: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// Get all schedules
const getSchedules = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, dayOfWeek, semester, venueId, lecturerId, courseCode, courseId } = req.query;
    const where = {};
    
    // Apply filters
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    if (semester) where.semester = semester;
    if (venueId) where.venueId = venueId;
    if (lecturerId) where.lecturerId = lecturerId;
    if (courseId) where.courseId = courseId;
    if (courseCode) {
      where.course = {
        code: {
          contains: courseCode,
          mode: 'insensitive'
        }
      };
    }
    
    // Students see only their enrolled courses' schedules
    if (req.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        select: { courseId: true }
      });
      // If there's already a courseId filter, we need to intersect with enrolled courses
      if (where.courseId) {
        where.courseId = {
          in: enrollments.map(e => e.courseId).filter(id => id === where.courseId)
        };
      } else {
        where.courseId = { in: enrollments.map(e => e.courseId) };
      }
    }
    
    // Lecturers see their courses' schedules
    if (req.user.role === 'LECTURER') {
      where.course = { lecturerId: req.user.id };
    }

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const schedules = await prisma.schedule.findMany({
      where,
      skip,
      take,
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        venue: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Get total count for pagination
    const total = await prisma.schedule.count({ where });

    res.status(200).json({
      success: true,
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    next(error);
  }
};

// Create schedule (Lecturer/Admin only)
const createSchedule = async (req, res, next) => {
  try {
    const { courseId, venueId, dayOfWeek, startTime, endTime, semester } = req.body;

    // Validate required fields
    validateRequired(['courseId', 'venueId', 'dayOfWeek', 'startTime', 'endTime', 'semester'], req.body);

    // Validate day of week
    if (!validateDayOfWeek(dayOfWeek)) {
      return next(new AppError('Invalid day of week', 400));
    }

    // Validate time format and range
    const timeValidation = validateTimeRange(startTime, endTime);
    if (!timeValidation.valid) {
      return next(new AppError(timeValidation.message, 400));
    }

    // Validate semester format
    if (!validateSemester(semester)) {
      return next(new AppError('Invalid semester format. Example: "2024 Fall" or "2024 Semester 1"', 400));
    }

    // Check if venue exists and is available
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    if (venue.status === 'MAINTENANCE') {
      return next(new AppError('Venue is under maintenance and cannot be booked', 400));
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Validate lecturer assignment
    if (req.user.role === 'LECTURER' && course.lecturerId !== req.user.id) {
      return next(new AppError('You are not assigned as the lecturer for this course', 403));
    }

    // Check for venue conflicts - proper interval overlap detection
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        venueId,
        dayOfWeek,
        semester, // Also check same semester
        NOT: {
          OR: [
            // No overlap: new schedule ends before existing starts
            { endTime: { lte: startTime } },
            // No overlap: new schedule starts after existing ends
            { startTime: { gte: endTime } }
          ]
        }
      },
      include: {
        course: {
          select: { code: true, name: true }
        }
      }
    });

    if (conflictingSchedule) {
      return next(new AppError(
        `Venue is already booked for this time slot. Conflict with: ${conflictingSchedule.course?.code || 'another course'}`,
        400
      ));
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        venueId,
        lecturerId: course.lecturerId,
        dayOfWeek,
        startTime,
        endTime,
        semester
      },
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        venue: true
      }
    });

    // Emit socket event
    req.socketUtils.broadcastScheduleUpdate(schedule);

    // Notify enrolled students about the new schedule
    try {
      // Get enrolled students for this course and create notifications directly
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId },
        select: { studentId: true }
      });

      // Create notifications for each enrolled student
      await Promise.all(enrolledStudents.map(enrollment =>
        prisma.notification.create({
          data: {
            userId: enrollment.studentId,
            type: 'SCHEDULE_CREATED',
            message: `New schedule added for ${schedule.course.name} on ${dayOfWeek} at ${startTime} in ${schedule.venue.name}`,
            link: `/schedules/${schedule.id}`
          }
        })
      ));

      // Emit Socket.IO notifications to affected users
      const io = req.app.get('io');
      const scheduleEnrolledStudents = await prisma.enrollment.findMany({
        where: { courseId },
        select: { studentId: true }
      });

      scheduleEnrolledStudents.forEach(enrollment => {
        io.to(`user:${enrollment.studentId}`).emit('notification', {
          type: 'SCHEDULE_CREATED',
          message: `New schedule added for ${schedule.course.name} on ${dayOfWeek}`,
          link: `/schedules/${schedule.id}`
        });
      });
    } catch (error) {
      console.error('Error sending schedule creation notifications:', error);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// Update schedule (Lecturer/Admin only)
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { venueId, dayOfWeek, startTime, endTime, semester } = req.body;

    // Get existing schedule
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        course: {
          select: { lecturerId: true }
        }
      }
    });

    if (!existingSchedule) {
      return next(new AppError('Schedule not found', 404));
    }

    // Check authorization
    if (req.user.role === 'LECTURER' && existingSchedule.course.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    // Prepare update data
    const updateData = {};
    const checkVenueId = venueId || existingSchedule.venueId;
    const checkDay = dayOfWeek || existingSchedule.dayOfWeek;
    const checkStart = startTime || existingSchedule.startTime;
    const checkEnd = endTime || existingSchedule.endTime;
    const checkSemester = semester || existingSchedule.semester;

    // Validate day of week if provided
    if (dayOfWeek && !validateDayOfWeek(dayOfWeek)) {
      return next(new AppError('Invalid day of week', 400));
    }

    // Validate time format and range if times are provided
    if (startTime || endTime) {
      const finalStart = startTime || existingSchedule.startTime;
      const finalEnd = endTime || existingSchedule.endTime;
      const timeValidation = validateTimeRange(finalStart, finalEnd);
      if (!timeValidation.valid) {
        return next(new AppError(timeValidation.message, 400));
      }
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
    }

    // Validate semester if provided
    if (semester && !validateSemester(semester)) {
      return next(new AppError('Invalid semester format. Example: "2024 Fall" or "2024 Semester 1"', 400));
    }
    if (semester) updateData.semester = semester;

    // Check venue if being changed
    if (venueId && venueId !== existingSchedule.venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId }
      });

      if (!venue) {
        return next(new AppError('Venue not found', 404));
      }

      if (venue.status === 'MAINTENANCE') {
        return next(new AppError('Venue is under maintenance and cannot be booked', 400));
      }
      updateData.venueId = venueId;
    }

    // Update other fields
    if (dayOfWeek) updateData.dayOfWeek = dayOfWeek;

    // Check for venue conflicts if any relevant field changed
    if (venueId || dayOfWeek || startTime || endTime || semester) {
      const conflictingSchedule = await prisma.schedule.findFirst({
        where: {
          id: { not: id },
          venueId: checkVenueId,
          dayOfWeek: checkDay,
          semester: checkSemester,
          NOT: {
            OR: [
              // No overlap: new schedule ends before existing starts
              { endTime: { lte: checkStart } },
              // No overlap: new schedule starts after existing ends
              { startTime: { gte: checkEnd } }
            ]
          }
        },
        include: {
          course: {
            select: { code: true, name: true }
          }
        }
      });

      if (conflictingSchedule) {
        return next(new AppError(
          `Venue is already booked for this time slot. Conflict with: ${conflictingSchedule.course?.code || 'another course'}`,
          400
        ));
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        venue: true
      }
    });

    // Emit socket event
    req.socketUtils.broadcastScheduleUpdate(updatedSchedule);

    // Notify enrolled students about the schedule update
    try {
      // Get enrolled students for this course and create notifications directly
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId: updatedSchedule.course.id },
        select: { studentId: true }
      });

      // Create notifications for each enrolled student
      await Promise.all(enrolledStudents.map(enrollment =>
        prisma.notification.create({
          data: {
            userId: enrollment.studentId,
            type: 'SCHEDULE_UPDATED',
            message: `Schedule updated for ${updatedSchedule.course.name} on ${updatedSchedule.dayOfWeek} at ${updatedSchedule.startTime}`,
            link: `/schedules/${id}`
          }
        })
      ));

      // Emit Socket.IO notifications to affected users
      const io = req.app.get('io');
      enrolledStudents.forEach(enrollment => {
        io.to(`user:${enrollment.studentId}`).emit('notification', {
          type: 'SCHEDULE_UPDATED',
          message: `Schedule updated for ${updatedSchedule.course.name}`,
          link: `/schedules/${id}`
        });
      });
    } catch (error) {
      console.error('Error sending schedule update notifications:', error);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
};

// Delete schedule (Lecturer/Admin only)
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get schedule with course info before deletion
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            lecturerId: true
          }
        }
      }
    });

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    // Check if lecturer owns the course or is admin
    if (req.user.role === 'LECTURER' && schedule.course.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to delete this schedule', 403));
    }

    await prisma.schedule.delete({
      where: { id }
    });

    // Emit socket event for deletion
    req.socketUtils.emitToCourse(schedule.course.id, 'schedule-deleted', { id });

    // Notify enrolled students about the schedule deletion
    try {
      // Get enrolled students for this course and create notifications directly
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId: schedule.course.id },
        select: { studentId: true }
      });

      // Create notifications for each enrolled student
      await Promise.all(enrolledStudents.map(enrollment =>
        prisma.notification.create({
          data: {
            userId: enrollment.studentId,
            type: 'SCHEDULE_DELETED',
            message: `Schedule cancelled for ${schedule.course.name} on ${schedule.dayOfWeek} at ${schedule.startTime}`,
            link: `/courses/${schedule.course.id}`
          }
        })
      ));

      // Emit Socket.IO notifications to affected users
      const io = req.app.get('io');
      enrolledStudents.forEach(enrollment => {
        io.to(`user:${enrollment.studentId}`).emit('notification', {
          type: 'SCHEDULE_DELETED',
          message: `Schedule cancelled for ${schedule.course.name}`,
          link: `/courses/${schedule.course.id}`
        });
      });
    } catch (error) {
      console.error('Error sending schedule deletion notifications:', error);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySchedule,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
};