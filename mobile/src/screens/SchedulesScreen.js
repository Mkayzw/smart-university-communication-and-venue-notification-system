import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { InfoCard } from '../components/cards/InfoCard';
import { LoadingState } from '../components/common/LoadingState';
import { ListEmptyState } from '../components/common/EmptyState';

const ScheduleCard = ({ item, onPress }) => {
  const courseName = item.course?.name || 'Unknown Course';
  const courseCode = item.course?.code || '';
  const venueName = item.venue?.name || 'TBA';
  const lecturerName = item.lecturer
    ? `${item.lecturer.firstName || ''} ${item.lecturer.lastName || ''}`.trim()
    : 'TBA';

  const subtitle = `${courseCode} • ${item.dayOfWeek}, ${item.startTime} - ${item.endTime}\nVenue: ${venueName} • Lecturer: ${lecturerName}`;

  return (
    <InfoCard
      title={courseName}
      subtitle={subtitle}
      icon="calendar"
      onPress={onPress}
    />
  );
};

export const SchedulesScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isLecturer = user?.role === 'LECTURER';

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
      <SafeAreaView className="flex-1 bg-slate-50">
        <LoadingState fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ListEmptyState
          icon="alert-circle"
          message="Error fetching schedules. Please try again."
          iconColor="#ef4444"
        />
      </SafeAreaView>
    );
  }

  const schedules = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">{isAdmin ? 'Manage Schedules' : 'My Schedule'}</Text>
        {(isAdmin || isLecturer) && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateSchedule')}
            className="bg-brand-500 p-3 rounded-full shadow-sm"
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ScheduleCard
            item={item}
            onPress={(isAdmin || isLecturer) ? () => navigation.navigate('EditSchedule', { schedule: item }) : null}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <ListEmptyState
            icon="calendar"
            message={(isAdmin || isLecturer) ? "No schedules found. Create your first schedule!" : "No schedules found."}
          />
        }
      />
    </SafeAreaView>
  );
};
