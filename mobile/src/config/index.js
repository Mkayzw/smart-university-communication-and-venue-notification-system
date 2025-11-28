export const config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://smart-comms-backend.onrender.com/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://smart-comms-backend.onrender.com',
  APP_NAME: 'Smart Uni Hub',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true' || false,
}

