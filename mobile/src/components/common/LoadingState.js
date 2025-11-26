import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export const LoadingState = ({ 
  size = 'large', 
  color = '#14b8a6', 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const Container = fullScreen ? View : View;
  
  return (
    <Container className={`flex-1 items-center justify-center ${fullScreen ? 'bg-slate-50' : ''}`}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-slate-500 mt-3 text-center">{message}</Text>
      )}
    </Container>
  );
};

export const InlineLoader = ({ size = 'small', color = '#14b8a6' }) => (
  <ActivityIndicator size={size} color={color} className="self-center mt-4" />
);