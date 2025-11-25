// Simple test script to verify Socket.IO implementation
const io = require('socket.io-client');

console.log('Testing Socket.IO connection to backend...');

// Test connection without authentication first
const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server successfully!');
  
  // Test with authentication
  console.log('Testing authenticated connection...');
  const authSocket = io('http://localhost:3000', {
    auth: {
      token: 'test-token'
    }
  });
  
  authSocket.on('connect', () => {
    console.log('✅ Authenticated connection successful!');
  });
  
  authSocket.on('connect_error', (error) => {
    console.log('❌ Authenticated connection failed:', error.message);
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
});

// Test event listeners
socket.on('new-announcement', (data) => {
  console.log('📢 Received announcement:', data);
});

socket.on('notification', (data) => {
  console.log('🔔 Received notification:', data);
});

socket.on('schedule-update', (data) => {
  console.log('📅 Received schedule update:', data);
});

console.log('Socket.IO test client started. Open browser to http://localhost:3000 to test real-time functionality.');
console.log('This test will run for 30 seconds...');

setTimeout(() => {
  console.log('Test completed. Disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 30000);