import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

export const CreateAnnouncementScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const [targetAudienceOpen, setTargetAudienceOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    pinned: false
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

  const handleCheckboxChange = (field) => {
    setForm(prevState => ({ ...prevState, [field]: !prevState[field] }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!form.title.trim()) {
      errors.push('Title is required');
    }
    if (!form.content.trim()) {
      errors.push('Content is required');
    }
    
    return errors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }
    
    mutation.mutate(form);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="px-4 pt-4">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Create Announcement</Text>

        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Title <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.title}
              onChangeText={(val) => handleInputChange('title', val)}
              placeholder="Enter announcement title"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Content <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.content}
              onChangeText={(val) => handleInputChange('content', val)}
              placeholder="Enter announcement content"
              multiline
              numberOfLines={8}
              className="bg-white rounded-xl border border-slate-300 p-3 h-48"
            />
          </View>
          
          <View style={{ zIndex: 1000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Target Audience</Text>
            <DropDownPicker
              open={targetAudienceOpen}
              value={form.targetAudience}
              items={[
                { label: 'All Users', value: 'ALL' },
                { label: 'Students Only', value: 'STUDENTS' },
                { label: 'Lecturers Only', value: 'LECTURERS' }
              ]}
              setOpen={setTargetAudienceOpen}
              setValue={(callback) => {
                const value = callback(form.targetAudience);
                handleInputChange('targetAudience', value);
              }}
              listMode="MODAL"
            />
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => handleCheckboxChange('pinned')}
              className="h-5 w-5 border-2 border-gray-300 rounded mr-3 flex items-center justify-center bg-white"
            >
              {form.pinned && (
                <View className="h-3 w-3 bg-blue-600 rounded" />
              )}
            </TouchableOpacity>
            <Text className="text-sm text-gray-700">Pin this announcement to the top</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${mutation.isPending ? 'opacity-50' : ''}`}
        >
          {mutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Create Announcement</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
