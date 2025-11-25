import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';

const ScheduleCard = ({ item, onPress }) => {
  const courseName = item.course?.name || 'Unknown Course';
  const courseCode = item.course?.code || '';
  const venueName = item.venue?.name || 'TBA';
  const lecturerName = item.lecturer 
    ? `${item.lecturer.firstName || ''} ${item.lecturer.lastName || ''}`.trim() 
    : 'TBA';

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
        <Text className="text-base font-semibold text-slate-900">{courseName}</Text>
        <Text className="text-sm text-slate-500 mt-1">{courseCode}</Text>
        <Text className="text-sm text-slate-500 mt-1">{`${item.dayOfWeek}, ${item.startTime} - ${item.endTime}`}</Text>
        <Text className="text-sm text-slate-500 mt-1">{`Venue: ${venueName}`}</Text>
        <Text className="text-sm text-slate-500 mt-1">{`Lecturer: ${lecturerName}`}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const SchedulesScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Admins see all schedules, others see their own
  const endpoint = isAdmin ? '/schedules' : '/schedules/my-schedule';
  const queryKey = isAdmin ? ['schedules'] : ['my-schedule'];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => apiFetch(endpoint, { token }),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-red-500">Error fetching schedules.</Text>
      </SafeAreaView>
    );
  }

  const schedules = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">{isAdmin ? 'Manage Schedules' : 'My Schedule'}</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateSchedule')}
            className="bg-brand-500 p-2 rounded-full"
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ScheduleCard
            item={item}
            onPress={isAdmin ? () => navigation.navigate('EditSchedule', { schedule: item }) : null}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-slate-500">No schedules found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
