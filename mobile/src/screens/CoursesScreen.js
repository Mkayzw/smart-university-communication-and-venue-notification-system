import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useDebounce } from '../hooks/useDebounce';
import { InfoCard } from '../components/cards/InfoCard';
import { LoadingState } from '../components/common/LoadingState';
import { ListEmptyState } from '../components/common/EmptyState';

const CourseCard = ({ item, onPress }) => {
  // Adapt to both data structures: direct course object or enrollment object with nested course
  const course = item.course || item;

  return (
    <InfoCard
      title={course.name}
      subtitle={`${course.code} • ${course.department || 'No department'}`}
      icon="book-open"
      onPress={onPress}
    />
  );
};

export const CoursesScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isLecturer = user?.role === 'LECTURER';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch all courses for admins, or only "my" courses for lecturers/students
  let endpoint, queryKey;
  if (isAdmin) {
    endpoint = '/courses';
    queryKey = ['all-courses', debouncedSearchQuery];
  } else {
    endpoint = '/courses/my';
    queryKey = ['my-courses'];
  }

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => apiFetch(endpoint, {
      token,
      params: isAdmin ? { search: debouncedSearchQuery } : {}
    }),
    enabled: !!token && !(isAdmin && debouncedSearchQuery), // Enable search for admins only
  });

  if (isLoading && !data) { // Show loading indicator only on initial load
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
          message="Error fetching courses. Please try again."
          iconColor="#ef4444"
        />
      </SafeAreaView>
    );
  }

  const courses = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">
          {isAdmin ? 'Manage Courses' : 'My Courses'}
        </Text>
        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateCourse')}
            className="bg-brand-500 p-3 rounded-full shadow-sm"
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      {isAdmin && (
        <View className="px-4 mb-4">
          <TextInput
            placeholder="Search by name, code, or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-white rounded-xl border border-slate-300 p-3 shadow-sm"
          />
        </View>
      )}

      <FlatList
        data={courses}
        keyExtractor={(item) => (item.course?.id || item.id).toString()}
        renderItem={({ item }) => {
          const courseItem = item.course || item;
          return (
            <CourseCard
              item={courseItem}
              onPress={() => isAdmin && navigation.navigate('EditCourse', { course: courseItem })}
            />
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <ListEmptyState
            icon="book-open"
            message={isAdmin ? "No courses found. Create your first course!" : "No courses found."}
          />
        }
      />
    </SafeAreaView>
  );
};
