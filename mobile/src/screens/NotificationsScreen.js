import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';

const NotificationCard = ({ item, onMarkAsRead }) => {
  const icon = item.type === 'ANNOUNCEMENT' ? 'bell' : item.type === 'SCHEDULE' ? 'calendar' : 'info';
  return (
    <TouchableOpacity onPress={onMarkAsRead} className={`p-4 mb-3 rounded-2xl border ${item.read ? 'bg-white border-slate-200' : 'bg-brand-50 border-brand-200'}`}>
      <View className="flex-row items-start">
        <Feather name={icon} size={20} color={item.read ? '#64748b' : '#14b8a6'} className="mr-4 mt-1" />
        <View className="flex-1">
          <Text className={`text-base font-semibold ${item.read ? 'text-slate-600' : 'text-slate-900'}`}>{item.message}</Text>
          <Text className="text-sm text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/notifications', { token, params: { limit: 50 } }),
    enabled: !!token,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PUT', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiFetch('/notifications/read/all', { method: 'PUT', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  if (isLoading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }
  
  const notifications = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
        <TouchableOpacity onPress={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
          <Text className="font-semibold text-brand-500">Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard item={item} onMarkAsRead={() => !item.read && markAsReadMutation.mutate(item.id)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-slate-500">You have no notifications.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
