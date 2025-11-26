import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const EmptyState = ({ 
  icon = 'inbox', 
  title, 
  message, 
  actionText,
  onAction,
  iconColor = '#94a3b8'
}) => {
  return (
    <View className="flex-1 items-center justify-center mt-20 px-6">
      <Feather name={icon} size={48} color={iconColor} />
      <Text className="text-lg font-semibold text-slate-700 mt-4 text-center">
        {title}
      </Text>
      {message && (
        <Text className="text-slate-500 mt-2 text-center text-sm">
          {message}
        </Text>
      )}
      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-6 bg-brand-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const ListEmptyState = ({ 
  icon = 'inbox', 
  message, 
  iconColor = '#94a3b8'
}) => {
  return (
    <View className="items-center justify-center py-12">
      <Feather name={icon} size={40} color={iconColor} />
      <Text className="text-slate-500 mt-3 text-center text-sm">
        {message}
      </Text>
    </View>
  );
};