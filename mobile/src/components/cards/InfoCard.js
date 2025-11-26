import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const InfoCard = ({ 
  title, 
  subtitle, 
  icon, 
  onPress, 
  rightComponent,
  borderColor = 'border-slate-200',
  backgroundColor = 'bg-white',
  textColor = 'text-slate-900',
  subtitleColor = 'text-slate-600'
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      onPress={onPress}
      disabled={!onPress}
      className={`${backgroundColor} p-4 rounded-xl mb-3 border ${borderColor} shadow-sm`}
    >
      <View className="flex-row items-center">
        {icon && (
          <View className="bg-teal-50 p-2 rounded-lg mr-3">
            <Feather name={icon} size={18} color="#14b8a6" />
          </View>
        )}
        <View className="flex-1">
          <Text className={`font-semibold ${textColor}`}>{title}</Text>
          {subtitle && (
            <Text className={`text-sm ${subtitleColor} mt-1`}>{subtitle}</Text>
          )}
        </View>
        {rightComponent && (
          <View>{rightComponent}</View>
        )}
      </View>
    </CardComponent>
  );
};

export const ActionCard = ({ 
  title, 
  icon, 
  onPress, 
  color = 'teal',
  flex = false
}) => {
  const colorClasses = {
    teal: 'bg-teal-50 border-teal-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
  };
  
  const iconColors = {
    teal: '#14b8a6',
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#10b981',
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`${colorClasses[color]} p-3 rounded-xl flex-row items-center ${flex ? 'flex-1' : ''} min-w-[45%] border border-slate-200 shadow-sm`}
    >
      <Feather name={icon} size={20} color={iconColors[color]} />
      <Text className="ml-3 text-sm font-semibold text-slate-900">{title}</Text>
    </TouchableOpacity>
  );
};