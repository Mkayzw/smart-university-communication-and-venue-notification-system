require('dotenv').config();
const { app, server, PORT } = require('./app');

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

// Graceful shutdown handlers are already in app.js