import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';

// Reusable Stat Card
const StatCard = ({ icon, label, value, color }) => (
  <View className={`bg-${color}-100 p-4 rounded-2xl flex-1 items-center`}>
    <Feather name={icon} size={24} color={color === 'brand' ? '#14b8a6' : '#64748b'} />
    <Text className="text-2xl font-bold text-slate-900 mt-2">{value ?? '-'}</Text>
    <Text className="text-sm font-semibold text-slate-600">{label}</Text>
  </View>
);

// Admin Dashboard Component
const AdminDashboard = ({ navigation, token }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch('/users/stats', { token }), // Assuming a stats endpoint exists
    enabled: !!token,
  });

  const stats = data?.data || {};

  return (
    <View>
      <View className="flex-row gap-x-4 mb-6">
        <StatCard icon="users" label="Students" value={stats.students} color="brand" />
        <StatCard icon="user-check" label="Lecturers" value={stats.lecturers} color="slate" />
      </View>
       <View className="flex-row gap-x-4 mb-6">
        <StatCard icon="book-open" label="Courses" value={stats.courses} color="slate" />
        <StatCard icon="map-pin" label="Venues" value={stats.venues} color="brand" />
      </View>
      <Text className="text-lg font-bold text-slate-900 mb-3">Quick Actions</Text>
      <TouchableOpacity onPress={() => navigation.navigate('CreateCourse')} className="bg-white p-4 rounded-xl mb-3 flex-row items-center">
          <Feather name="plus-circle" size={24} color="#14b8a6" />
          <Text className="ml-4 text-base font-semibold">Create Course</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('CreateVenue')} className="bg-white p-4 rounded-xl mb-3 flex-row items-center">
          <Feather name="plus-circle" size={24} color="#14b8a6" />
          <Text className="ml-4 text-base font-semibold">Create Venue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('CreateSchedule')} className="bg-white p-4 rounded-xl mb-3 flex-row items-center">
          <Feather name="plus-circle" size={24} color="#14b8a6" />
          <Text className="ml-4 text-base font-semibold">Create Schedule</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('CreateAnnouncement')} className="bg-white p-4 rounded-xl mb-3 flex-row items-center">
          <Feather name="plus-circle" size={24} color="#14b8a6" />
          <Text className="ml-4 text-base font-semibold">Create Announcement</Text>
      </TouchableOpacity>
    </View>
  );
};

// Student/Lecturer Dashboard Component
const UserDashboard = ({ navigation, token, isLecturer = false }) => {
    const {data: coursesData, isLoading: coursesLoading} = useQuery({
        queryKey: ['my-courses'],
        queryFn: () => apiFetch('/courses/my', {token, params: {limit: 3}}),
        enabled: !!token,
    })
    const courses = coursesData?.data || [];

    const {data: announcementsData, isLoading: announcementsLoading} = useQuery({
        queryKey: ['announcements'],
        queryFn: () => apiFetch('/announcements', {token, params: {limit: 3}}),
        enabled: !!token,
    })
    const announcements = announcementsData?.data || [];

    return (
        <View>
            {/* Quick Actions for Lecturers */}
            {isLecturer && (
                <View className="mb-4">
                    <Text className="text-lg font-bold text-slate-900 mb-3">Quick Actions</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateSchedule')} className="bg-white p-4 rounded-xl mb-3 flex-row items-center">
                        <Feather name="calendar" size={24} color="#14b8a6" />
                        <Text className="ml-4 text-base font-semibold">Create Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateAnnouncement')} className="bg-white p-4 rounded-xl mb-3 flex-row items-center">
                        <Feather name="bell" size={24} color="#14b8a6" />
                        <Text className="ml-4 text-base font-semibold">Create Announcement</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-slate-900">Latest Announcements</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                    <Text className="font-semibold text-brand-500">View All</Text>
                </TouchableOpacity>
            </View>
            {announcementsLoading ? <ActivityIndicator/> : announcements.map(a => (
                 <TouchableOpacity key={a.id} onPress={() => navigation.navigate('AnnouncementDetail', { id: a.id })} className="bg-white p-4 rounded-xl mb-3">
                    <Text className="font-bold text-slate-800">{a.title}</Text>
                    <Text className="text-slate-600 mt-1" numberOfLines={2}>{a.content}</Text>
                </TouchableOpacity>
            ))}

            <View className="flex-row justify-between items-center mt-4 mb-3">
                 <Text className="text-lg font-bold text-slate-900">My Courses</Text>
                 <TouchableOpacity onPress={() => navigation.navigate('My Courses')}>
                    <Text className="font-semibold text-brand-500">View All</Text>
                </TouchableOpacity>
            </View>
            {coursesLoading ? <ActivityIndicator/> : courses.map(c => {
                const course = c.course || c;
                return (
                    <View key={course.id} className="bg-white p-4 rounded-xl mb-3">
                        <Text className="font-bold">{course.name}</Text>
                        <Text className="text-slate-600">{course.code}</Text>
                    </View>
                );
            })}
        </View>
    )
}


export const DashboardScreen = ({ navigation }) => {
  const { user, token, logout } = useAuth();

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: () => apiFetch('/notifications', { token, params: { unreadOnly: true, limit: 1 } }),
    enabled: !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const unreadCount = unreadData?.pagination?.total || 0;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard navigation={navigation} token={token} />;
      case 'LECTURER':
        return <UserDashboard navigation={navigation} token={token} isLecturer={true} />;
      case 'STUDENT':
        return <UserDashboard navigation={navigation} token={token} />;
      default:
        return <Text>Welcome!</Text>;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Custom Header */}
      <View className="flex-row justify-between items-center px-4 pt-4 pb-3 bg-slate-50">
        <View>
          <Text className="text-sm text-slate-500">Welcome, {user.role.toLowerCase()}</Text>
          <Text className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} className="relative">
          <Feather name="bell" size={28} color="#334155" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-slate-50">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView className="px-4">
        {renderRoleDashboard()}
      </ScrollView>
    </SafeAreaView>
  );
};
