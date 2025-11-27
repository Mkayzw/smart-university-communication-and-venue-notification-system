require('dotenv').config();
const { app, server, PORT } = require('../app');
const { startCronJobs } = require('./utils/cronJobs');
const { Server } = require('socket.io');

// Trust proxy headers in production (required for Render and other platforms)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// Get Socket.IO instance from app module
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Start server
server.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' API Server is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API Docs: http://localhost:${PORT}/api-docs`);
  console.log(' Socket.IO: Enabled');
  console.log('=================================\n');
  
  // Start cron jobs for automated tasks with Socket.IO instance
  startCronJobs(io);
});

// Graceful shutdown handlers are already in app.js