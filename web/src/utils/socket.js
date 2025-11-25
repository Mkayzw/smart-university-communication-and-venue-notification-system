import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      auth: { token }
    });
    
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

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const socketEvents = {
  NOTIFICATION: 'notification',
  NEW_ANNOUNCEMENT: 'new-announcement',
  SCHEDULE_UPDATE: 'schedule-update',
  CONNECTED: 'connected'
};