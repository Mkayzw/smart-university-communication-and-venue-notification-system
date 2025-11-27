require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const Expo = require('expo-server-sdk').Expo;

// Import utilities
const { errorHandler, AppError } = require('./src/utils/errorHandler');
const logger = require('./src/utils/logger');
const swaggerDocument = require('./src/config/swagger.json');
const socketHandler = require('./src/socket/socketHandler');
const notificationService = require('./src/services/notificationService');
const { createNotification, notifyCourseStudents } = notificationService;



// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const announcementRoutes = require('./src/routes/announcementRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const venueRoutes = require('./src/routes/venueRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

// Import middleware
const { authenticate, authorize } = require('./src/middleware/auth');
const { generateToken } = require('./src/controllers/authController');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Trust proxy headers in production 
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize notification service with prisma instance
notificationService.setPrisma(prisma);

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
  req.app.set('io', io); // Make io available to controllers
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
const PORT = process.env.PORT || 3000;

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