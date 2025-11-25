import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useDebounce } from '../hooks/useDebounce';

const VenueCard = ({ item, onPress }) => {
  const statusColor = item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
        <View className="flex-row justify-between items-start">
          <Text className="text-base font-semibold text-slate-900 w-4/5">{item.name}</Text>
          <Text className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>{item.status}</Text>
        </View>
        <Text className="text-sm text-slate-500 mt-1">{item.building}</Text>
        <Text className="text-sm text-slate-500 mt-1">Capacity: {item.capacity}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const VenuesScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['venues', debouncedSearchQuery],
    queryFn: () => apiFetch('/venues', {
      token,
      params: { search: debouncedSearchQuery }
    }),
    enabled: !!token,
  });

  if (isLoading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-red-500">Error fetching venues.</Text>
      </SafeAreaView>
    );
  }

  const venues = data?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-slate-900">Venues</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateVenue')}
            className="bg-brand-500 p-2 rounded-full"
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <View className="px-4 mb-4">
        <TextInput
          placeholder="Search by name or building..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-white rounded-xl border border-slate-300 p-3"
        />
      </View>

      {isLoading && <ActivityIndicator className="mt-4" />}

      <FlatList
        data={venues}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VenueCard
            item={item}
            onPress={isAdmin ? () => navigation.navigate('EditVenue', { venue: item }) : null}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-slate-500">No venues found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
