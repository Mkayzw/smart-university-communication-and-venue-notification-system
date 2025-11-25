import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

export const CreateVenueScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    building: '',
    capacity: '',
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('AVAILABLE');

  const statusItems = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Unavailable', value: 'UNAVAILABLE' },
    { label: 'Under Maintenance', value: 'MAINTENANCE' },
  ];

  const mutation = useMutation({
    mutationFn: (newVenue) => apiFetch('/venues', {
      method: 'POST',
      token,
      body: newVenue,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['venues'] });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to create venue.");
    },
  });

  const handleInputChange = (field, value) => {
    setForm(prevState => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = () => {
    const finalData = {
      ...form,
      capacity: parseInt(form.capacity, 10),
      status: statusValue,
    };
    mutation.mutate(finalData);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Create New Venue</Text>

        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Venue Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(val) => handleInputChange('name', val)}
              placeholder="e.g., Main Lecture Hall"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Building</Text>
            <TextInput
              value={form.building}
              onChangeText={(val) => handleInputChange('building', val)}
              placeholder="e.g., Faculty of Science"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Capacity</Text>
            <TextInput
              value={form.capacity}
              onChangeText={(val) => handleInputChange('capacity', val)}
              keyboardType="numeric"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View style={{ zIndex: 1000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Status</Text>
            <DropDownPicker
              open={statusOpen}
              value={statusValue}
              items={statusItems}
              setOpen={setStatusOpen}
              setValue={setStatusValue}
              listMode="MODAL"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${mutation.isPending ? 'opacity-50' : ''}`}
        >
          {mutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Create Venue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
