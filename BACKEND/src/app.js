require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const Expo = require('expo-server-sdk').Expo;

// Import utilities
const { errorHandler, AppError } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const swaggerDocument = require('./config/swagger.json');
const socketHandler = require('./socket/socketHandler');
const notificationService = require('./services/notificationService');
const { createNotification, notifyCourseStudents } = notificationService;

// Initialize notification service with prisma instance
notificationService.setPrisma(prisma);
const {
  validateEmail,
  validatePassword,
  validateRequired,
  validateRole,
  validateDayOfWeek,
  validateTimeFormat,
  validateTimeRange,
  validateSemester
} = require('./utils/validator');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Trust proxy headers in production (required for Render and other platforms)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Expo SDK for push notifications
const expo = new Expo();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Initialize socket handlers
const socketUtils = socketHandler(io);

// Make utilities available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  req.socketUtils = socketUtils;
  req.expo = expo;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Validate required environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

// JWT Token Generation
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        studentId: true,
        staffId: true
      }
    });
    
    if (!req.user) {
      return next(new AppError('User not found', 404));
    }
    
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('User not authorized to access this route', 403));
    }
    next();
  };
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, studentId, staffId, department } = req.body;

    validateRequired(['email', 'password', 'firstName', 'lastName', 'role'], req.body);

    if (!validateEmail(email)) {
      return next(new AppError('Invalid email format', 400));
    }

    if (!validatePassword(password)) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    if (!validateRole(role)) {
      return next(new AppError('Invalid role. Must be STUDENT, LECTURER, or ADMIN', 400));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        studentId,
        staffId,
        department
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateRequired(['email', 'password'], req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = generateToken(user.id);

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// ==================== USER ROUTES ====================

// Get all users (Admin only)
app.get('/api/users', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (department) {
      where.department = department;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { staffId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          studentId: true,
          staffId: true,
          createdAt: true
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
app.put('/api/users/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, department, pushToken } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to update this profile', 403));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        department,
        pushToken
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        pushToken: true
      }
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== COURSE ROUTES ====================

// Get all courses
app.get('/api/courses', authenticate, async (req, res, next) => {
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

    const courses = await prisma.course.findMany({
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
    const total = await prisma.course.count({ where });

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
});

// Get my courses (Student: enrolled, Lecturer: teaching)
app.get('/api/courses/my', authenticate, async (req, res, next) => {
  try {
    let courses = [];
    
    if (req.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
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
      courses = await prisma.course.findMany({
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
});

// Get departments list
app.get('/api/courses/departments', authenticate, async (req, res, next) => {
  try {
    const departments = await prisma.course.findMany({
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
});

// Get single course
app.get('/api/courses/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
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
});

// Create course (Lecturer/Admin only)
app.post('/api/courses', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { code, name, description, credits, department, maxStudents } = req.body;

    validateRequired(['code', 'name', 'credits', 'department'], req.body);

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        credits,
        department,
        maxStudents: maxStudents || 50,
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
    req.socketUtils.emitCourseUpdate('created', course);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// Enroll in course (Student only)
app.post('/api/courses/:id/enroll', authenticate, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: id,
        studentId: req.user.id
      }
    });

    if (existingEnrollment) {
      return next(new AppError('Already enrolled in this course', 400));
    }

    const enrollment = await prisma.enrollment.create({
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

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

// Drop/Unenroll from course (Student only)
app.delete('/api/courses/:id/enroll', authenticate, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: id,
        studentId: req.user.id
      }
    });

    if (!enrollment) {
      return next(new AppError('Not enrolled in this course', 404));
    }

    await prisma.enrollment.delete({
      where: { id: enrollment.id }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    next(error);
  }
});

// Update course (Lecturer/Admin)
app.put('/api/courses/:id', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, credits, department } = req.body;

    // Check if lecturer owns the course or is admin
    if (req.user.role === 'LECTURER') {
      const course = await prisma.course.findUnique({
        where: { id },
        select: { lecturerId: true }
      });

      if (!course || course.lecturerId !== req.user.id) {
        return next(new AppError('Not authorized to update this course', 403));
      }
    }

    const updatedCourse = await prisma.course.update({
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
});

// Delete course (Admin only)
app.delete('/api/courses/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get course students (Lecturer/Admin)
app.get('/api/courses/:id/students', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if lecturer owns the course or is admin
    if (req.user.role === 'LECTURER') {
      const course = await prisma.course.findUnique({
        where: { id },
        select: { lecturerId: true }
      });

      if (!course || course.lecturerId !== req.user.id) {
        return next(new AppError('Not authorized to view this course students', 403));
      }
    }

    const enrollments = await prisma.enrollment.findMany({
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
});

// ==================== ANNOUNCEMENT ROUTES ====================

// Get all announcements
app.get('/api/announcements', authenticate, async (req, res, next) => {
  try {
    const { category, priority } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
});

// Get single announcement
app.get('/api/announcements/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
});

// Create announcement (Lecturer/Admin only)
app.post('/api/announcements', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { title, content, category, priority, targetAudience } = req.body;

    validateRequired(['title', 'content', 'category'], req.body);

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        priority: priority || 'MEDIUM',
        targetAudience,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Emit socket event
    req.socketUtils.emitAnnouncementUpdate('created', announcement);

    // Create database notifications for target audience
    try {
      await createNotification({
        targetAudience: targetAudience || 'ALL',
        type: 'NEW_ANNOUNCEMENT',
        message: `New announcement: ${title}`,
        link: `/announcements/${announcement.id}`,
        excludeUserId: req.user.id
      });

      // Emit Socket.IO notifications based on target audience
      if (targetAudience === 'STUDENTS') {
        io.to('role:STUDENT').emit('notification', {
          type: 'NEW_ANNOUNCEMENT',
          message: `New announcement: ${title}`,
          link: `/announcements/${announcement.id}`
        });
      } else if (targetAudience === 'LECTURERS') {
        io.to('role:LECTURER').emit('notification', {
          type: 'NEW_ANNOUNCEMENT',
          message: `New announcement: ${title}`,
          link: `/announcements/${announcement.id}`
        });
      } else {
        io.emit('notification', {
          type: 'NEW_ANNOUNCEMENT',
          message: `New announcement: ${title}`,
          link: `/announcements/${announcement.id}`
        });
      }
    } catch (error) {
      console.error('Error creating announcement notifications:', error);
      // Don't fail the request if notification fails
    }

    // Send push notifications
    if (priority === 'HIGH' || priority === 'URGENT') {
      const users = await prisma.user.findMany({
        where: {
          pushToken: {
            not: null
          }
        },
        select: {
          pushToken: true
        }
      });

      const messages = users
        .filter(user => Expo.isExpoPushToken(user.pushToken))
        .map(user => ({
          to: user.pushToken,
          sound: 'default',
          title: announcement.title,
          body: announcement.content.substring(0, 100),
          data: { announcementId: announcement.id }
        }));

      if (messages.length > 0) {
        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error('Error sending push notifications:', error);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
});

// Update announcement (Author/Admin only)
app.put('/api/announcements/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, targetAudience } = req.body;

    // Check if user owns the announcement or is admin
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    if (announcement.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to update this announcement', 403));
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        category,
        priority,
        targetAudience
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Emit socket event
    req.socketUtils.emitAnnouncementUpdate('updated', updatedAnnouncement);

    res.status(200).json({
      success: true,
      data: updatedAnnouncement
    });
  } catch (error) {
    next(error);
  }
});

// Delete announcement (Author/Admin only)
app.delete('/api/announcements/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user owns the announcement or is admin
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    if (announcement.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to delete this announcement', 403));
    }

    await prisma.announcement.delete({
      where: { id }
    });

    // Emit socket event
    req.socketUtils.emitAnnouncementUpdate('deleted', { id });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Add comment to announcement
app.post('/api/announcements/:id/comments', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    validateRequired(['content'], req.body);

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        announcementId: id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
});

// Delete comment (Author/Admin only)
app.delete('/api/announcements/comments/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user owns the comment or is admin
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to delete this comment', 403));
    }

    await prisma.comment.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SCHEDULE ROUTES ====================

// Get my personal schedule
app.get('/api/schedules/my-schedule', authenticate, async (req, res, next) => {
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
});

// Get all schedules
app.get('/api/schedules', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = {};
    
    // Students see only their enrolled courses' schedules
    if (req.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        select: { courseId: true }
      });
      where.courseId = { in: enrollments.map(e => e.courseId) };
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
});

// Create schedule (Lecturer/Admin only)
app.post('/api/schedules', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { courseId, venueId, dayOfWeek, startTime, endTime, semester, type } = req.body;

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
        semester,
        type: type || 'LECTURE'
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
    req.socketUtils.emitScheduleUpdate('created', schedule);

    // Notify enrolled students about the new schedule
    try {
      await notifyCourseStudents({
        courseId,
        type: 'SCHEDULE_CREATED',
        message: `New schedule added for ${schedule.course.name} on ${dayOfWeek} at ${startTime} in ${schedule.venue.name}`,
        link: `/schedules/${schedule.id}`
      });

      // Emit Socket.IO notifications to affected users
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId },
        select: { studentId: true }
      });

      enrolledStudents.forEach(enrollment => {
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
});

// Update schedule (Lecturer/Admin only)
app.put('/api/schedules/:id', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { venueId, dayOfWeek, startTime, endTime, semester, type } = req.body;

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
    if (type) updateData.type = type;

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
    req.socketUtils.emitScheduleUpdate('updated', updatedSchedule);

    // Notify enrolled students about the schedule update
    try {
      await notifyCourseStudents({
        courseId: updatedSchedule.course.id,
        type: 'SCHEDULE_UPDATED',
        message: `Schedule updated for ${updatedSchedule.course.name} on ${updatedSchedule.dayOfWeek} at ${updatedSchedule.startTime}`,
        link: `/schedules/${id}`
      });

      // Emit Socket.IO notifications to affected users
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId: updatedSchedule.course.id },
        select: { studentId: true }
      });

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
});

// Delete schedule (Lecturer/Admin only)
app.delete('/api/schedules/:id', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
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

    // Emit socket event
    req.socketUtils.emitScheduleUpdate('deleted', { id });

    // Notify enrolled students about the schedule deletion
    try {
      await notifyCourseStudents({
        courseId: schedule.course.id,
        type: 'SCHEDULE_DELETED',
        message: `Schedule cancelled for ${schedule.course.name} on ${schedule.dayOfWeek} at ${schedule.startTime}`,
        link: `/courses/${schedule.course.id}`
      });

      // Emit Socket.IO notifications to affected users
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId: schedule.course.id },
        select: { studentId: true }
      });

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
});

// ==================== VENUE ROUTES ====================

// Import venue occupancy utilities
const { 
  getVenuesWithOccupancy, 
  isVenueCurrentlyOccupied,
  getVenueScheduleForToday 
} = require('./utils/venueOccupancy');

// Get venues with real-time occupancy status
app.get('/api/venues/realtime', authenticate, async (req, res, next) => {
  try {
    const venues = await getVenuesWithOccupancy();
    
    res.status(200).json({
      success: true,
      data: venues,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time venue status:', error);
    next(error);
  }
});

// Check available venues
app.get('/api/venues/available', authenticate, async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.query;

    const where = { status: 'AVAILABLE' };

    // If time parameters are provided, check for conflicts
    if (dayOfWeek && startTime && endTime) {
      const conflictingSchedules = await prisma.schedule.findMany({
        where: {
          dayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            }
          ]
        },
        select: { venueId: true }
      });

      const occupiedVenueIds = conflictingSchedules.map(s => s.venueId);
      
      if (occupiedVenueIds.length > 0) {
        where.id = { notIn: occupiedVenueIds };
      }
    }

    const venues = await prisma.venue.findMany({
      where,
      orderBy: [
        { building: 'asc' },
        { name: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      data: venues
    });
  } catch (error) {
    next(error);
  }
});

// Get all venues
app.get('/api/venues', authenticate, async (req, res, next) => {
  try {
    const { available, building, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (building) where.building = building;
    if (available !== undefined) where.status = available === 'true' ? 'AVAILABLE' : 'OCCUPIED';

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const venues = await prisma.venue.findMany({
      where,
      skip,
      take,
      include: {
        schedules: {
          include: {
            course: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { building: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get total count for pagination
    const total = await prisma.venue.count({ where });

    res.status(200).json({
      success: true,
      data: venues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    next(error);
  }
});

// Get single venue
app.get('/api/venues/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            course: {
              select: {
                code: true,
                name: true
              }
            }
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
});

// Create venue (Admin only)
app.post('/api/venues', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, building, capacity, facilities } = req.body;

    validateRequired(['name', 'building', 'capacity'], req.body);

    const venue = await prisma.venue.create({
      data: {
        name,
        building,
        capacity,
        facilities: facilities || [],
        status: 'AVAILABLE'
      }
    });

    // Emit socket event
    req.socketUtils.emitVenueUpdate('created', venue);

    res.status(201).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
});

// Update venue (Admin only)
app.put('/api/venues/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, building, capacity, facilities } = req.body;

    const venue = await prisma.venue.update({
      where: { id },
      data: {
        name,
        building,
        capacity,
        facilities
      }
    });

    // Emit socket event
    req.socketUtils.emitVenueUpdate('updated', venue);

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
});

// Update venue availability
app.patch('/api/venues/:id/availability', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(status)) {
      return next(new AppError('Invalid status. Must be AVAILABLE, OCCUPIED, or MAINTENANCE', 400));
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: { status }
    });

    // Emit socket event
    req.socketUtils.emitVenueUpdate('updated', venue);

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
});

// Delete venue (Admin only)
app.delete('/api/venues/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.venue.delete({
      where: { id }
    });

    // Emit socket event
    req.socketUtils.emitVenueUpdate('deleted', { id });

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== NOTIFICATION ROUTES ====================

// Get user notifications
app.get('/api/notifications', authenticate, async (req, res, next) => {
  try {
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

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
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
});

// Get unread notification count
app.get('/api/notifications/unread/count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
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
});

// Mark all notifications as read
app.put('/api/notifications/read/all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
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
});

// Delete notification
app.delete('/api/notifications/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    if (notification.userId !== req.user.id) {
      return next(new AppError('Not authorized to delete this notification', 403));
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Register push token
app.post('/api/notifications/push-token', authenticate, async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!Expo.isExpoPushToken(pushToken)) {
      return next(new AppError('Invalid push token', 400));
    }

    await prisma.user.update({
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
});

// ==================== DASHBOARD STATS ====================

app.get('/api/dashboard/stats', authenticate, async (req, res, next) => {
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
});

// ==================== UTILITY ROUTES ====================

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart University Communication and Venue Notification System API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Server startup will be handled by server.js
// Export PORT for server.js to use
const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, server, PORT };
