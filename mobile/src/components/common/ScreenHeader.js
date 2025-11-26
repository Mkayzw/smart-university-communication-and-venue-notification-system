import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const ScreenHeader = ({ 
  title, 
  subtitle, 
  rightComponent, 
  onBackPress,
  backgroundColor = 'bg-slate-50',
  showBackButton = false 
}) => {
  return (
    <View className={`${backgroundColor} px-4 pt-4 pb-3`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {showBackButton && (
            <TouchableOpacity onPress={onBackPress} className="mr-3">
              <Feather name="arrow-left" size={24} color="#334155" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-900">{title}</Text>
            {subtitle && (
              <Text className="text-sm text-slate-500 mt-1">{subtitle}</Text>
            )}
          </View>
        </View>
        {rightComponent && (
          <View>{rightComponent}</View>
        )}
      </View>
    </View>
  );
};