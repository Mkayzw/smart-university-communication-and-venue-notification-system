require('dotenv').config();
const { app, server } = require('./app');

const PORT = process.env.PORT || 5000;

// Trust proxy headers in production (required for Render and other platforms)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// Start server
server.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' API Server is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API Docs: http://localhost:${PORT}/api-docs`);
  console.log(' Socket.IO: Enabled');
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});