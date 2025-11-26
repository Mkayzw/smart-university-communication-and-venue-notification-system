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

const AnnouncementCard = ({ item, onPress }) => (
  <InfoCard
    title={item.title}
    subtitle={`${new Date(item.createdAt).toLocaleDateString()} • ${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}`}
    icon="bell"
    onPress={onPress}
  />
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
          message="Error fetching announcements. Please try again."
          iconColor="#ef4444"
        />
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
            className="bg-brand-500 p-3 rounded-full shadow-sm"
          >
            <Feather name="plus" size={20} color="white" />
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
          <ListEmptyState
            icon="bell"
            message={isAdmin ? "No announcements found. Create your first announcement!" : "No announcements found."}
          />
        }
      />
    </SafeAreaView>
  );
};
