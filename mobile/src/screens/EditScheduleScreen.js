import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

export const EditScheduleScreen = ({ navigation, route }) => {
  const { schedule } = route.params;
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [courseOpen, setCourseOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);
  
  const [form, setForm] = useState({
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    semester: schedule.semester,
  });
  const [courseValue, setCourseValue] = useState(schedule.courseId);
  const [venueValue, setVenueValue] = useState(schedule.venueId);

  const { data: coursesData, isLoading: coursesLoading } = useQuery({ queryKey: ['all-courses-list'], queryFn: () => apiFetch('/courses', { token, params: { limit: 1000 } }), enabled: !!token });
  const { data: venuesData, isLoading: venuesLoading } = useQuery({ queryKey: ['all-venues-list'], queryFn: () => apiFetch('/venues', { token, params: { limit: 1000 } }), enabled: !!token });
  
  const courseItems = useMemo(() => (coursesData?.data || []).map(c => ({ label: `${c.code} - ${c.name}`, value: c.id })), [coursesData]);
  const venueItems = useMemo(() => (venuesData?.data || []).map(v => ({ label: v.name, value: v.id })), [venuesData]);
  const dayItems = [
      {label: 'Monday', value: 'MONDAY'}, {label: 'Tuesday', value: 'TUESDAY'}, {label: 'Wednesday', value: 'WEDNESDAY'},
      {label: 'Thursday', value: 'THURSDAY'}, {label: 'Friday', value: 'FRIDAY'}, {label: 'Saturday', value: 'SATURDAY'},
      {label: 'Sunday', value: 'SUNDAY'}
  ];
  
  const updateMutation = useMutation({
    mutationFn: (updatedSchedule) => apiFetch(`/schedules/${schedule.id}`, { method: 'PUT', token, body: updatedSchedule }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['schedules'] });
      navigation.goBack();
    },
    onError: (error) => Alert.alert("Error", error.message || "Failed to update schedule."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/schedules/${schedule.id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['schedules'] });
      navigation.goBack();
    },
    onError: (error) => Alert.alert("Error", error.message || "Failed to delete schedule."),
  });

  const handleInputChange = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const handleSubmit = () => updateMutation.mutate({ ...form, courseId: courseValue, venueId: venueValue });
  const handleDelete = () => Alert.alert("Delete Schedule", "Are you sure you want to delete this schedule?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
  ]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Edit Schedule</Text>

        <View className="gap-y-4">
          <View style={{ zIndex: 3000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Course</Text>
            <DropDownPicker open={courseOpen} value={courseValue} items={courseItems} setOpen={setCourseOpen} setValue={setCourseValue} loading={coursesLoading} searchable={true} listMode="MODAL" />
          </View>
          <View style={{ zIndex: 2000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Venue</Text>
            <DropDownPicker open={venueOpen} value={venueValue} items={venueItems} setOpen={setVenueOpen} setValue={setVenueValue} loading={venuesLoading} searchable={true} listMode="MODAL" />
          </View>
           <View style={{ zIndex: 1000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Day of the Week</Text>
            <DropDownPicker items={dayItems} value={form.dayOfWeek} onSelectItem={(item) => handleInputChange('dayOfWeek', item.value)} listMode="MODAL" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Start Time (HH:MM)</Text>
            <TextInput value={form.startTime} onChangeText={v => handleInputChange('startTime', v)} className="bg-white rounded-xl border border-slate-300 p-3" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">End Time (HH:MM)</Text>
            <TextInput value={form.endTime} onChangeText={v => handleInputChange('endTime', v)} className="bg-white rounded-xl border border-slate-300 p-3" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Semester</Text>
            <TextInput value={form.semester} onChangeText={v => handleInputChange('semester', v)} className="bg-white rounded-xl border border-slate-300 p-3" />
          </View>
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={updateMutation.isPending || deleteMutation.isPending} className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${updateMutation.isPending || deleteMutation.isPending ? 'opacity-50' : ''}`}>
          {updateMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Update Schedule</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} disabled={deleteMutation.isPending || updateMutation.isPending} className={`bg-red-500 rounded-xl p-4 mt-2 mb-6 items-center ${deleteMutation.isPending || updateMutation.isPending ? 'opacity-50' : ''}`}>
          {deleteMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Delete Schedule</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
