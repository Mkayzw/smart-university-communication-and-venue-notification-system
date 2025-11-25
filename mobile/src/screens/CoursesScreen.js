import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useDebounce } from '../hooks/useDebounce';

const CourseCard = ({ item, onPress }) => {
  // Adapt to both data structures: direct course object or enrollment object with nested course
  const course = item.course || item;

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <Text className="text-xs font-semibold text-brand-600 mb-1">{course.code}</Text>
      <Text className="text-base font-semibold text-slate-900">{course.name}</Text>
      <Text className="text-sm text-slate-500 mt-1">{course.department}</Text>
    </TouchableOpacity>
  );
};

export const CoursesScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const isAdminOrLecturer = user?.role === 'ADMIN' || user?.role === 'LECTURER';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch all courses for admins/lecturers, or only "my" courses for students
  const endpoint = isAdminOrLecturer ? '/courses' : '/courses/my';
  const queryKey = isAdminOrLecturer ? ['all-courses', debouncedSearchQuery] : ['my-courses'];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => apiFetch(endpoint, { 
      token,
      params: { search: debouncedSearchQuery }
    }),
    enabled: !!token && !(!isAdminOrLecturer && debouncedSearchQuery), // Disable search for students for now
  });

  if (isLoading && !data) { // Show loading indicator only on initial load
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-red-500">Error fetching courses.</Text>
      </SafeAreaView>
    );
  }

  const courses = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">
          {isAdminOrLecturer ? 'Manage Courses' : 'My Courses'}
        </Text>
        {isAdminOrLecturer && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('CreateCourse')}
            className="bg-brand-500 p-2 rounded-full"
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      {isAdminOrLecturer && (
        <View className="px-4 mb-4">
          <TextInput
            placeholder="Search by name, code, or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-white rounded-xl border border-slate-300 p-3"
          />
        </View>
      )}

      {isLoading && <ActivityIndicator className="mt-4" />}

      <FlatList
        data={courses}
        keyExtractor={(item) => (item.course?.id || item.id).toString()}
        renderItem={({ item }) => {
          const courseItem = item.course || item;
          return (
            <CourseCard 
              item={courseItem} 
              onPress={() => isAdminOrLecturer && navigation.navigate('EditCourse', { course: courseItem })}
            />
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-slate-500">No courses found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
