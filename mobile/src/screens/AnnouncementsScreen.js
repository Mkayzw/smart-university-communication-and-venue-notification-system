import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';

const AnnouncementCard = ({ item, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 active:bg-slate-50"
  >
    <Text className="text-base font-semibold text-slate-900 mb-1">{item.title}</Text>
    <Text className="text-sm text-slate-600 mb-2" numberOfLines={2}>{item.content}</Text>
    <Text className="text-xs text-slate-400">
      {new Date(item.createdAt).toLocaleDateString()}
    </Text>
  </TouchableOpacity>
);

export const AnnouncementsScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => apiFetch('/announcements', { token }),
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
        <Text className="text-red-500">Error fetching announcements.</Text>
      </SafeAreaView>
    );
  }

  const announcements = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">Announcements</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateAnnouncement')}
            className="bg-brand-500 p-2 rounded-full"
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AnnouncementCard
            item={item}
            onPress={() => navigation.navigate('AnnouncementDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-slate-500">No announcements found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
