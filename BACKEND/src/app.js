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
const {
  validateEmail,
  validatePassword,
  validateRequired,
  validateRole
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

// JWT Token Generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
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
    const users = await prisma.user.findMany({
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
      }
    });

    res.status(200).json({
      success: true,
      data: users
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

// ==================== COURSE ROUTES ====================

// Get all courses
app.get('/api/courses', authenticate, async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
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

    res.status(200).json({
      success: true,
      data: courses
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

// ==================== SCHEDULE ROUTES ====================

// Get all schedules
app.get('/api/schedules', authenticate, async (req, res, next) => {
  try {
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

// Create schedule (Lecturer/Admin only)
app.post('/api/schedules', authenticate, authorize('LECTURER', 'ADMIN'), async (req, res, next) => {
  try {
    const { courseId, venueId, dayOfWeek, startTime, endTime, type } = req.body;

    validateRequired(['courseId', 'venueId', 'dayOfWeek', 'startTime', 'endTime'], req.body);

    // Check for venue conflicts
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        venueId,
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
      }
    });

    if (conflictingSchedule) {
      return next(new AppError('Venue is already booked for this time slot', 400));
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        venueId,
        dayOfWeek,
        startTime,
        endTime,
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

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
});

// ==================== VENUE ROUTES ====================

// Get all venues
app.get('/api/venues', authenticate, async (req, res, next) => {
  try {
    const { available, building } = req.query;
    
    const where = {};
    if (building) where.building = building;
    if (available !== undefined) where.isAvailable = available === 'true';

    const venues = await prisma.venue.findMany({
      where,
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
        { roomNumber: 'asc' }
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

// Create venue (Admin only)
app.post('/api/venues', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, building, roomNumber, capacity, type, facilities } = req.body;

    validateRequired(['name', 'building', 'roomNumber', 'capacity'], req.body);

    const venue = await prisma.venue.create({
      data: {
        name,
        building,
        roomNumber,
        capacity,
        type: type || 'LECTURE_HALL',
        facilities: facilities || [],
        isAvailable: true
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

// Update venue availability
app.patch('/api/venues/:id/availability', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const venue = await prisma.venue.update({
      where: { id },
      data: { isAvailable }
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

// ==================== NOTIFICATION ROUTES ====================

// Get user notifications
app.get('/api/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: notifications
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
        isRead: true,
        readAt: new Date()
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
            isRead: false 
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
