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

  // Check if we have enough info to fetch available venues
  const canFetchAvailableVenues = form.dayOfWeek && form.startTime && form.endTime;
  
  // Fetch available venues when day and time are selected
  const { data: availableVenuesData, isLoading: availableVenuesLoading } = useQuery({
    queryKey: ['available-venues', form.dayOfWeek, form.startTime, form.endTime],
    queryFn: () => apiFetch('/venues/available', { 
      token, 
      params: { 
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime
      } 
    }),
    enabled: !!token && canFetchAvailableVenues,
  });

  // Fallback: fetch all venues if no time is selected
  const { data: allVenuesData, isLoading: allVenuesLoading } = useQuery({
    queryKey: ['all-venues-list'],
    queryFn: () => apiFetch('/venues', { token, params: { limit: 1000 } }),
    enabled: !!token && !canFetchAvailableVenues,
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({ 
    queryKey: ['all-courses-list'], 
    queryFn: () => apiFetch('/courses', { token, params: { limit: 1000 } }), 
    enabled: !!token 
  });
  
  const courseItems = useMemo(() => (coursesData?.data || []).map(c => ({ label: `${c.code} - ${c.name}`, value: c.id })), [coursesData]);
  
  // Use available venues if we have time info, otherwise all venues
  const venues = canFetchAvailableVenues 
    ? (availableVenuesData?.data || [])
    : (allVenuesData?.data || []);
  
  const venueItems = useMemo(() => {
    const items = venues.map(v => ({ 
      label: `${v.name} (${v.building})${v.status === 'MAINTENANCE' ? ' [Maintenance]' : ''}`, 
      value: v.id 
    }));
    
    // Include currently selected venue even if not in available list (for editing)
    if (venueValue && !items.find(item => item.value === venueValue)) {
      items.unshift({ 
        label: `Current: ${schedule.venue?.name || 'Selected venue'}`, 
        value: venueValue 
      });
    }
    
    // If we have time selected but no venues available, add a message
    if (canFetchAvailableVenues && venues.length === 0 && !availableVenuesLoading) {
      items.push({ 
        label: '⚠️ No venues available for this time', 
        value: null,
        disabled: true 
      });
    }
    
    return items;
  }, [venues, canFetchAvailableVenues, availableVenuesLoading, venueValue, schedule.venue]);
  
  const venuesLoading = canFetchAvailableVenues ? availableVenuesLoading : allVenuesLoading;
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

  const handleInputChange = (field, value) => {
    setForm(p => {
      const newForm = { ...p, [field]: value };
      
      // Reset venue selection when day or time changes (unless it's the original venue)
      if ((field === 'dayOfWeek' || field === 'startTime' || field === 'endTime') && venueValue !== schedule.venueId) {
        setVenueValue(null);
      }
      
      return newForm;
    });
  };
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
            <View className="flex-row items-center mb-1">
              <Text className="text-sm font-semibold text-slate-700">Venue</Text>
              {canFetchAvailableVenues && (
                <Text className="text-xs text-green-600 ml-2">(Available venues only)</Text>
              )}
            </View>
            {!canFetchAvailableVenues && (
              <Text className="text-xs text-amber-600 mb-1">⚠️ Select day and time first to see available venues</Text>
            )}
            <DropDownPicker 
              open={venueOpen} 
              value={venueValue} 
              items={venueItems} 
              setOpen={setVenueOpen} 
              setValue={setVenueValue} 
              loading={venuesLoading} 
              searchable={true} 
              listMode="MODAL"
              disabled={canFetchAvailableVenues && venues.length === 0 && venueValue !== schedule.venueId}
              placeholder={venuesLoading ? 'Loading available venues...' : canFetchAvailableVenues && venues.length === 0 ? 'No venues available for this time' : 'Select a venue'}
            />
            {canFetchAvailableVenues && venues.length === 0 && !venuesLoading && (
              <Text className="text-xs text-red-600 mt-1">No venues are available for the selected time. Please choose a different time slot.</Text>
            )}
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
