import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';

const queryClient = new QueryClient();

const AppContent = () => {
  usePushNotifications(); // This hook will handle everything
  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
