import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { InfoCard } from '../components/cards/InfoCard';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'LECTURER': return 'Lecturer';
      case 'STUDENT': return 'Student';
      default: return 'User';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-900">Profile</Text>
      </View>

      <View className="px-6 mt-4">
        <View className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-brand-500 items-center justify-center mr-4">
              <Text className="text-white text-2xl font-bold">
                {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
              </Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-slate-800">{user?.firstName} {user?.lastName}</Text>
              <Text className="text-slate-500">{user?.email}</Text>
            </View>
          </View>
          <View className="border-t border-slate-200 pt-4">
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">Role</Text>
              <Text className="font-semibold text-slate-800">{getRoleDisplayName(user?.role)}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">Department</Text>
              <Text className="font-semibold text-slate-800">{user?.department}</Text>
            </View>
            {user?.studentId && (
              <View className="flex-row justify-between py-2">
                <Text className="text-slate-500">Student ID</Text>
                <Text className="font-semibold text-slate-800">{user?.studentId}</Text>
              </View>
            )}
            {user?.staffId && (
              <View className="flex-row justify-between py-2">
                <Text className="text-slate-500">Staff ID</Text>
                <Text className="font-semibold text-slate-800">{user?.staffId}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={logout}
          className="mt-6 flex-row items-center justify-center bg-red-500 rounded-xl p-4"
        >
          <Feather name="log-out" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
