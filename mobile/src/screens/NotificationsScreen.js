import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { getSocket, socketEvents } from '../utils/socket';

const getNotificationIcon = (type) => {
  if (type?.includes('SCHEDULE')) return 'calendar';
  if (type === 'NEW_ANNOUNCEMENT') return 'bell';
  return 'info';
};

const getNotificationColor = (type, read) => {
  if (read) return '#64748b';
  if (type?.includes('SCHEDULE')) return '#3b82f6';
  if (type === 'NEW_ANNOUNCEMENT') return '#a855f7';
  return '#14b8a6';
};

const NotificationCard = ({ item, onMarkAsRead, onDelete }) => {
  const icon = getNotificationIcon(item.type);
  const iconColor = getNotificationColor(item.type, item.read);
  
  return (
    <View className={`p-4 mb-3 rounded-2xl border ${item.read ? 'bg-white border-slate-200' : 'bg-brand-50 border-brand-200'}`}>
      <View className="flex-row items-start">
        <Feather name={icon} size={20} color={iconColor} className="mr-4 mt-1" />
        <View className="flex-1">
          <Text className={`text-base font-semibold ${item.read ? 'text-slate-600' : 'text-slate-900'}`}>
            {item.message}
          </Text>
          <Text className="text-xs text-slate-400 mt-1 uppercase">
            {item.type?.replace(/_/g, ' ')}
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          <View className="flex-row gap-3 mt-3">
            {!item.read && (
              <TouchableOpacity onPress={onMarkAsRead}>
                <Text className="text-xs font-semibold text-brand-600">Mark as read</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete}>
                <Text className="text-xs font-semibold text-red-500">Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export const NotificationsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ unreadOnly: false, type: '' });
  const socket = getSocket();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => {
      const params = { limit: 50, page: 1 };
      if (filter.unreadOnly) params.unreadOnly = 'true';
      if (filter.type) params.type = filter.type;
      return apiFetch('/notifications', { token, params });
    },
    enabled: !!token,
  });

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    };

    socket.on(socketEvents.NOTIFICATION, handleNewNotification);

    return () => {
      socket.off(socketEvents.NOTIFICATION, handleNewNotification);
    };
  }, [socket, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH', token }),
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

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/notifications/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id)
        }
      ]
    );
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }
  
  const notifications = data?.data || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-sm text-slate-500 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity 
              onPress={() => markAllAsReadMutation.mutate()} 
              disabled={markAllAsReadMutation.isPending}
            >
              <Text className="font-semibold text-brand-500">
                {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter buttons */}
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            onPress={() => setFilter({ ...filter, unreadOnly: !filter.unreadOnly })}
            className={`px-4 py-2 rounded-xl ${
              filter.unreadOnly ? 'bg-brand-500' : 'bg-white border border-slate-200'
            }`}
          >
            <Text className={`text-sm font-semibold ${filter.unreadOnly ? 'text-white' : 'text-slate-600'}`}>
              {filter.unreadOnly ? 'Unread Only' : 'All'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard 
            item={item} 
            onMarkAsRead={() => !item.read && markAsReadMutation.mutate(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Feather name="bell-off" size={48} color="#94a3b8" />
            <Text className="text-slate-500 mt-4 text-center">
              {filter.unreadOnly ? 'No unread notifications' : 'You have no notifications.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
