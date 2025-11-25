import React, { useState } from 'react';
import { View, Text, TextInput, TouchableTouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

export const CreateAnnouncementScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    content: '',
  });

  const mutation = useMutation({
    mutationFn: (newAnnouncement) => apiFetch('/announcements', {
      method: 'POST',
      token,
      body: newAnnouncement,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['announcements'] });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to create announcement.");
    },
  });

  const handleInputChange = (field, value) => {
    setForm(prevState => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = () => {
    mutation.mutate(form);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="px-4 pt-4">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Create Announcement</Text>

        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Title</Text>
            <TextInput
              value={form.title}
              onChangeText={(val) => handleInputChange('title', val)}
              placeholder="Announcement Title"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Content</Text>
            <TextInput
              value={form.content}
              onChangeText={(val) => handleInputChange('content', val)}
              placeholder="Full announcement content..."
              multiline
              numberOfLines={8}
              className="bg-white rounded-xl border border-slate-300 p-3 h-48"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${mutation.isPending ? 'opacity-50' : ''}`}
        >
          {mutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Post Announcement</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
