import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { InfoCard, ActionCard } from '../components/cards/InfoCard';
import { InlineLoader } from '../components/common/LoadingState';

const { width } = Dimensions.get('window');

// Reusable Stat Card with improved styling
const StatCard = ({ icon, label, value, color = 'brand' }) => {
  const colorClasses = {
    brand: 'bg-teal-50 border-teal-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
  };
  
  const iconColors = {
    brand: '#14b8a6',
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#10b981',
  };

  return (
    <View className={`${colorClasses[color]} p-4 rounded-2xl flex-1 items-center border shadow-sm`}>
      <View className="bg-white rounded-full p-3 mb-3 shadow-sm">
        <Feather name={icon} size={20} color={iconColors[color]} />
      </View>
      <Text className="text-2xl font-bold text-slate-900">{value ?? '-'}</Text>
      <Text className="text-sm font-medium text-slate-600 mt-1">{label}</Text>
    </View>
  );
};

// Admin Dashboard Component - redesigned to match user dashboard
const AdminDashboard = ({ navigation, token }) => {
  const {data: coursesData, isLoading: coursesLoading} = useQuery({
      queryKey: ['all-courses'],
      queryFn: () => apiFetch('/courses', {token, params: {limit: 3}}),
      enabled: !!token,
  })
  const courses = coursesData?.data || [];

  const {data: announcementsData, isLoading: announcementsLoading} = useQuery({
      queryKey: ['announcements'],
      queryFn: () => apiFetch('/announcements', {token, params: {limit: 3}}),
      enabled: !!token,
  })
  const announcements = announcementsData?.data || [];

  const { data, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch('/users/stats', { token }),
    enabled: !!token,
  });

  const stats = data?.data || {};

  return (
      <View>
          {/* Quick Actions for Admin */}
          <View className="mb-4">
              <Text className="text-lg font-bold text-slate-900 mb-3">Quick Actions</Text>
              <View className="flex-row flex-wrap gap-3">
                  <TouchableOpacity onPress={() => navigation.navigate('CreateCourse')} className="bg-white p-3 rounded-xl flex-row items-center flex-1 min-w-[45%] border border-slate-200">
                      <Feather name="plus-circle" size={20} color="#14b8a6" />
                      <Text className="ml-3 text-sm font-semibold">Course</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('CreateVenue')} className="bg-white p-3 rounded-xl flex-row items-center flex-1 min-w-[45%] border border-slate-200">
                      <Feather name="plus-circle" size={20} color="#14b8a6" />
                      <Text className="ml-3 text-sm font-semibold">Venue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('CreateSchedule')} className="bg-white p-3 rounded-xl flex-row items-center flex-1 min-w-[45%] border border-slate-200">
                      <Feather name="plus-circle" size={20} color="#14b8a6" />
                      <Text className="ml-3 text-sm font-semibold">Schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('CreateAnnouncement')} className="bg-white p-3 rounded-xl flex-row items-center flex-1 min-w-[45%] border border-slate-200">
                      <Feather name="plus-circle" size={20} color="#14b8a6" />
                      <Text className="ml-3 text-sm font-semibold">Announcement</Text>
                  </TouchableOpacity>
              </View>
          </View>

          {/* Latest Announcements Section - same as user dashboard */}
          <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-slate-900">Latest Announcements</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                  <Text className="font-semibold text-brand-500">View All</Text>
              </TouchableOpacity>
          </View>
          {announcementsLoading ? <InlineLoader /> : announcements.map(a => (
               <InfoCard
                   key={a.id}
                   title={a.title}
                   subtitle={a.content}
                   icon="bell"
                   onPress={() => navigation.navigate('AnnouncementDetail', { id: a.id })}
               />
          ))}

          {/* Courses Section - same as user dashboard */}
          <View className="flex-row justify-between items-center mt-4 mb-3">
               <Text className="text-lg font-bold text-slate-900">Recent Courses</Text>
               <TouchableOpacity onPress={() => navigation.navigate('Manage Courses')}>
                  <Text className="font-semibold text-brand-500">View All</Text>
               </TouchableOpacity>
          </View>
          {coursesLoading ? <InlineLoader /> : courses.map(c => {
              const course = c.course || c;
              return (
                  <InfoCard
                      key={course.id}
                      title={course.name}
                      subtitle={course.code}
                      icon="book-open"
                  />
              );
          })}
      </View>
  )
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
                    <View className="flex-row flex-wrap gap-3">
                        <TouchableOpacity onPress={() => navigation.navigate('CreateSchedule')} className="bg-white p-3 rounded-xl flex-row items-center flex-1 min-w-[45%] border border-slate-200">
                            <Feather name="calendar" size={20} color="#14b8a6" />
                            <Text className="ml-3 text-sm font-semibold">Schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('CreateAnnouncement')} className="bg-white p-3 rounded-xl flex-row items-center flex-1 min-w-[45%] border border-slate-200">
                            <Feather name="bell" size={20} color="#14b8a6" />
                            <Text className="ml-3 text-sm font-semibold">Announcement</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-slate-900">Latest Announcements</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                    <Text className="font-semibold text-brand-500">View All</Text>
                </TouchableOpacity>
            </View>
            {announcementsLoading ? <InlineLoader /> : announcements.map(a => (
                 <InfoCard
                     key={a.id}
                     title={a.title}
                     subtitle={a.content}
                     icon="bell"
                     onPress={() => navigation.navigate('AnnouncementDetail', { id: a.id })}
                 />
            ))}

            <View className="flex-row justify-between items-center mt-4 mb-3">
                 <Text className="text-lg font-bold text-slate-900">My Courses</Text>
                 <TouchableOpacity onPress={() => navigation.navigate('My Courses')}>
                    <Text className="font-semibold text-brand-500">View All</Text>
                 </TouchableOpacity>
            </View>
            {coursesLoading ? <InlineLoader /> : courses.map(c => {
                const course = c.course || c;
                return (
                    <InfoCard
                        key={course.id}
                        title={course.name}
                        subtitle={course.code}
                        icon="book-open"
                    />
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
      {/* Improved Header with better spacing and layout */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-sm text-slate-500 mb-1">Welcome back</Text>
            <Text className="text-2xl font-bold text-slate-900">{user.firstName} {user.lastName}</Text>
            <Text className="text-sm text-slate-500 mt-1">{user.role.toLowerCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} className="relative bg-white p-3 rounded-full border border-slate-200 shadow-sm">
            <Feather name="bell" size={20} color="#334155" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Improved Notifications Card */}
      <View className="px-4 pb-4">
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          className="bg-white rounded-xl p-4 flex-row items-center justify-between border border-slate-200 shadow-sm"
        >
          <View className="flex-row items-center flex-1">
            <View className="bg-teal-50 p-2 rounded-lg mr-3">
              <Feather name="bell" size={18} color="#14b8a6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-slate-900">Notifications</Text>
              {unreadCount > 0 && (
                <Text className="text-sm text-slate-500">{unreadCount} unread</Text>
              )}
            </View>
          </View>
          {unreadCount > 0 ? (
            <View className="bg-red-500 rounded-full px-2 py-1 min-w-[24px] items-center justify-center">
              <Text className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount.toString()}</Text>
            </View>
          ) : (
            <Feather name="chevron-right" size={16} color="#94a3b8" />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        {renderRoleDashboard()}
      </ScrollView>
    </SafeAreaView>
  );
};
