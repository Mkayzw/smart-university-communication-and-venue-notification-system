import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

export const EditVenueScreen = ({ navigation, route }) => {
  const { venue } = route.params;
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: venue.name,
    building: venue.building,
    capacity: venue.capacity.toString(),
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState(venue.status);

  const statusItems = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Unavailable', value: 'UNAVAILABLE' },
    { label: 'Under Maintenance', value: 'MAINTENANCE' },
  ];

  const updateMutation = useMutation({
    mutationFn: (updatedVenue) => apiFetch(`/venues/${venue.id}`, {
      method: 'PUT',
      token,
      body: updatedVenue,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['venues'] });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to update venue.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/venues/${venue.id}`, {
      method: 'DELETE',
      token,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['venues'] });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to delete venue.");
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
    updateMutation.mutate(finalData);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Venue",
      "Are you sure you want to delete this venue? This will also remove any associated schedules.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Edit Venue</Text>

        <View className="gap-y-4">
            <View>
                <Text className="text-sm font-semibold text-slate-700 mb-1">Venue Name</Text>
                <TextInput
                value={form.name}
                onChangeText={(val) => handleInputChange('name', val)}
                className="bg-white rounded-xl border border-slate-300 p-3"
                />
            </View>
            <View>
                <Text className="text-sm font-semibold text-slate-700 mb-1">Building</Text>
                <TextInput
                value={form.building}
                onChangeText={(val) => handleInputChange('building', val)}
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
          disabled={updateMutation.isPending || deleteMutation.isPending}
          className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${updateMutation.isPending || deleteMutation.isPending ? 'opacity-50' : ''}`}
        >
          {updateMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Update Venue</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteMutation.isPending || updateMutation.isPending}
          className={`bg-red-500 rounded-xl p-4 mt-2 mb-6 items-center ${deleteMutation.isPending || updateMutation.isPending ? 'opacity-50' : ''}`}
        >
          {deleteMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Delete Venue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
