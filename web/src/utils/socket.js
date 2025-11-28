// Import Socket.IO client library
import { io } from 'socket.io-client';

// Global socket instance
let socket = null;

// Initialize Socket.IO connection with authentication
export const initializeSocket = (token) => {
  // Prevent multiple socket instances
  if (!socket) {
    // Get socket URL from environment or fallback to localhost
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Create socket connection with authentication token
    socket = io(socketUrl, {
      auth: { token }
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }
  return socket;
};

// Get current socket instance
export const getSocket = () => socket;

// Disconnect and cleanup socket connection
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event constants for consistent event naming
export const socketEvents = {
  NOTIFICATION: 'notification',
  NEW_ANNOUNCEMENT: 'new-announcement',
  SCHEDULE_UPDATE: 'schedule-update',
  CONNECTED: 'connected'
};