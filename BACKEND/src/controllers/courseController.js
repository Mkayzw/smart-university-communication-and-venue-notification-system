const { AppError } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validator');

// Get all courses
const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, department, lecturerId } = req.query;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (department) {
      where.department = department;
    }
    
    if (lecturerId) {
      where.lecturerId = lecturerId;
    }
    
    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const courses = await req.prisma.course.findMany({
      where,
      skip,
      take,
      include: {
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get total count for pagination
    const total = await req.prisma.course.count({ where });

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get my courses (Student: enrolled, Lecturer: teaching)
const getMyCourses = async (req, res, next) => {
  try {
    let courses = [];
    
    if (req.user.role === 'STUDENT') {
      const enrollments = await req.prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        include: {
          course: {
            include: {
              lecturer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
      courses = enrollments.map(e => e.course);
    } else if (req.user.role === 'LECTURER') {
      courses = await req.prisma.course.findMany({
        where: { lecturerId: req.user.id },
        include: {
          lecturer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// Get departments list
const getDepartments = async (req, res, next) => {
  try {
    const departments = await req.prisma.course.findMany({
      select: { department: true },
      distinct: ['department'],
      where: {
        department: {
          not: null
        }
      }
    });

    const departmentList = departments.map(d => d.department).filter(Boolean);

    res.status(200).json({
      success: true,
      data: departmentList
    });
  } catch (error) {
    next(error);
  }
};

// Get single course
const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await req.prisma.course.findUnique({
      where: { id },
      include: {
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true
              }
            }
          }
        },
        schedules: {
          include: {
            venue: true
          }
        }
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// Create course (Lecturer/Admin only)
const createCourse = async (req, res, next) => {
  try {
    const { code, name, description, credits, department } = req.body;

    validateRequired(['code', 'name', 'credits', 'department'], req.body);

    const course = await req.prisma.course.create({
      data: {
        code,
        name,
        description,
        credits,
        department,
        lecturerId: req.user.role === 'LECTURER' ? req.user.id : req.body.lecturerId
      },
      include: {
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Emit socket event
    req.socketUtils.emitToAll('course-created', course);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// Enroll in course (Student only)
const enrollInCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if already enrolled
    const existingEnrollment = await req.prisma.enrollment.findFirst({
      where: {
        courseId: id,
        studentId: req.user.id
      }
    });

    if (existingEnrollment) {
      return next(new AppError('Already enrolled in this course', 400));
    }

    const enrollment = await req.prisma.enrollment.create({
      data: {
        courseId: id,
        studentId: req.user.id
      },
      include: {
        course: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Notify student about enrollment using notification service
    try {
      const { notifyCourseStudents } = require('../services/notificationService');
      await notifyCourseStudents({
        courseId: id,
        type: 'COURSE_ENROLLED',
        message: `You have successfully enrolled in ${enrollment.course.name}`,
        link: `/courses/${id}`
      });
    } catch (error) {
      console.error('Failed to send enrollment notification:', error);
    }

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// Drop/Unenroll from course (Student only)
const dropCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await req.prisma.enrollment.findFirst({
      where: {
        courseId: id,
        studentId: req.user.id
      }
    });

    if (!enrollment) {
      return next(new AppError('Not enrolled in this course', 404));
    }

    await req.prisma.enrollment.delete({
      where: { id: enrollment.id }
    });

    // Notify student about course drop using notification service
    try {
      const { notifyCourseStudents } = require('../services/notificationService');
      await notifyCourseStudents({
        courseId: enrollment.course.id,
        type: 'COURSE_DROPPED',
        message: `You have been unenrolled from ${enrollment.course.name}`,
        link: `/courses/${enrollment.course.id}`
      });
    } catch (error) {
      console.error('Failed to send course drop notification:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    next(error);
  }
};

// Update course (Lecturer/Admin)
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, credits, department } = req.body;

    // Check if lecturer owns the course or is admin
    if (req.user.role === 'LECTURER') {
      const course = await req.prisma.course.findUnique({
        where: { id },
        select: { lecturerId: true }
      });

      if (!course || course.lecturerId !== req.user.id) {
        return next(new AppError('Not authorized to update this course', 403));
      }
    }

    const updatedCourse = await req.prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        credits,
        department
      },
      include: {
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// Delete course (Admin only)
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    await req.prisma.course.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get course students (Lecturer/Admin)
const getCourseStudents = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if lecturer owns the course or is admin
    if (req.user.role === 'LECTURER') {
      const course = await req.prisma.course.findUnique({
        where: { id },
        select: { lecturerId: true }
      });

      if (!course || course.lecturerId !== req.user.id) {
        return next(new AppError('Not authorized to view this course students', 403));
      }
    }

    const enrollments = await req.prisma.enrollment.findMany({
      where: { courseId: id },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
            department: true
          }
        }
      }
    });

    const students = enrollments.map(e => e.student);

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getMyCourses,
  getDepartments,
  getCourse,
  createCourse,
  enrollInCourse,
  dropCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents
};