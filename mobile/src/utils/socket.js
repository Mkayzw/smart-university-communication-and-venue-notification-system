import { io } from 'socket.io-client';
import { config } from '../config';

let socket = null;

export const initializeSocket = (token) => {
  if (!socket) {
    // Use dedicated socket URL from config
    const socketUrl = config.SOCKET_URL;
    
    if (config.DEBUG) {
      console.log('Connecting to Socket.IO at:', socketUrl);
    }
    
    socket = io(socketUrl, {
      auth: { token },
      transports: ['polling'], // Use polling only for better compatibility
      timeout: 10000, // 10 seconds timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: true // Force new connection to avoid caching issues
    });
    
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server with ID:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server. Reason:', reason);
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, reconnect manually
        socket.connect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      console.error('Full error details:', error);
      
      // If authentication fails, don't try to reconnect automatically
      if (error.message === 'Authentication error') {
        socket.disconnect();
        socket = null;
      }
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts');
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    if (config.DEBUG) {
      console.log('Socket disconnected manually');
    }
  }
};

export const socketEvents = {
  NOTIFICATION: 'notification',
  NEW_ANNOUNCEMENT: 'new-announcement',
  SCHEDULE_UPDATE: 'schedule-update',
  CONNECTED: 'connected',
  VENUE_CHANGE: 'venue-change',
  COURSE_CREATED: 'course-created',
  ANNOUNCEMENT_DELETED: 'announcement-deleted',
  SCHEDULE_DELETED: 'schedule-deleted'
};