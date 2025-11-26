export const config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.6:3000/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://172.20.10.6:3000',
  APP_NAME: 'Smart Uni Hub',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true' || false,
}

