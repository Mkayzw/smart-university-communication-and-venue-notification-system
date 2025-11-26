import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';
import { ErrorAlert } from '../components/ErrorAlert';
import { getErrorMessage } from '../utils/errorHandler';

export const CreateScheduleScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [courseOpen, setCourseOpen] = useState(false);
  const [courseValue, setCourseValue] = useState(null);
  const [venueOpen, setVenueOpen] = useState(false);
  const [venueValue, setVenueValue] = useState(null);
  const [dayOpen, setDayOpen] = useState(false);
  
  const [form, setForm] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    semester: ''
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses-list'],
    queryFn: () => apiFetch('/courses/my', { token, params: { limit: 1000 } }),
    enabled: !!token,
  });

  // Check if we have enough info to fetch available venues
  const canFetchAvailableVenues = useMemo(() =>
    !!(form.dayOfWeek && form.startTime && form.endTime), [form.dayOfWeek, form.startTime, form.endTime]
  );
  
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
    enabled: !!token && !!canFetchAvailableVenues,
  });

  // Fallback: fetch all venues if no time is selected
  const { data: allVenuesData, isLoading: allVenuesLoading } = useQuery({
    queryKey: ['all-venues-list'],
    queryFn: () => apiFetch('/venues', { token, params: { limit: 1000 } }),
    enabled: !!token && !canFetchAvailableVenues,
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
    
    // If we have time selected but no venues available, add a message
    if (canFetchAvailableVenues && venues.length === 0 && !availableVenuesLoading) {
      items.push({ 
        label: '⚠️ No venues available for this time', 
        value: null,
        disabled: true 
      });
    }
    
    return items;
  }, [venues, canFetchAvailableVenues, availableVenuesLoading]);
  
  const venuesLoading = canFetchAvailableVenues ? availableVenuesLoading : allVenuesLoading;
  const dayItems = [
      {label: 'Monday', value: 'MONDAY'}, {label: 'Tuesday', value: 'TUESDAY'}, {label: 'Wednesday', value: 'WEDNESDAY'},
      {label: 'Thursday', value: 'THURSDAY'}, {label: 'Friday', value: 'FRIDAY'}, {label: 'Saturday', value: 'SATURDAY'},
      {label: 'Sunday', value: 'SUNDAY'}
  ];

  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (newSchedule) => apiFetch('/schedules', { method: 'POST', token, body: newSchedule }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['schedules'] });
      navigation.goBack();
    },
    onError: (error) => {
      setError(error);
    },
  });

  const handleInputChange = (field, value) => {
    setForm(prevState => {
      const newState = { ...prevState, [field]: value };
      
      // Reset venue selection when day or time changes
      if (field === 'dayOfWeek' || field === 'startTime' || field === 'endTime') {
        setVenueValue(null);
      }
      
      return newState;
    });
  };
  
  const validateForm = () => {
    const errors = [];
    
    if (!courseValue) {
      errors.push('Course is required');
    }
    if (!venueValue) {
      errors.push('Venue is required');
    }
    if (!form.dayOfWeek) {
      errors.push('Day of week is required');
    }
    if (!form.startTime) {
      errors.push('Start time is required');
    }
    if (!form.endTime) {
      errors.push('End time is required');
    }
    if (!form.semester || !form.semester.trim()) {
      errors.push('Semester is required');
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (form.startTime && !timeRegex.test(form.startTime)) {
      errors.push('Invalid start time format. Use HH:MM (e.g., 09:00)');
    }
    if (form.endTime && !timeRegex.test(form.endTime)) {
      errors.push('Invalid end time format. Use HH:MM (e.g., 11:00)');
    }
    
    // Validate time range
    if (form.startTime && form.endTime) {
      if (form.startTime >= form.endTime) {
        errors.push('End time must be after start time');
      } else {
        const [startHours, startMinutes] = form.startTime.split(':').map(Number);
        const [endHours, endMinutes] = form.endTime.split(':').map(Number);
        const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        if (duration > 8 * 60) {
          errors.push('Schedule duration cannot exceed 8 hours');
        }
      }
    }
    
    // Validate semester format
    if (form.semester && form.semester.trim()) {
      const semesterPattern = /\d{4}/;
      if (!semesterPattern.test(form.semester) || form.semester.trim().length < 6) {
        errors.push('Invalid semester format. Example: "2024 Fall" or "2024 Semester 1"');
      }
    }
    
    return errors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }
    
    const finalData = {
      ...form,
      courseId: courseValue,
      venueId: venueValue,
    };
    mutation.mutate(finalData);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Create New Schedule</Text>

        {error && (
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
            onAction={(action) => {
              if (action === 'retry') {
                handleSubmit();
              }
            }}
          />
        )}

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
              disabled={canFetchAvailableVenues && venues.length === 0}
              placeholder={venuesLoading ? 'Loading available venues...' : canFetchAvailableVenues && venues.length === 0 ? 'No venues available for this time' : 'Select a venue'}
            />
            {canFetchAvailableVenues && venues.length === 0 && !venuesLoading && (
              <Text className="text-xs text-red-600 mt-1">No venues are available for the selected time. Please choose a different time slot.</Text>
            )}
          </View>
          <View style={{ zIndex: 1000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Day of Week <Text className="text-red-500">*</Text></Text>
            <DropDownPicker
              open={dayOpen}
              value={form.dayOfWeek}
              items={dayItems}
              setOpen={setDayOpen}
              setValue={(callback) => {
                const value = callback(form.dayOfWeek);
                handleInputChange('dayOfWeek', value);
              }}
              listMode="MODAL"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Start Time <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.startTime}
              onChangeText={v => handleInputChange('startTime', v)}
              placeholder="e.g., 09:00"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">End Time <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.endTime}
              onChangeText={v => handleInputChange('endTime', v)}
              placeholder="e.g., 11:00"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Semester <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.semester}
              onChangeText={v => handleInputChange('semester', v)}
              placeholder="e.g., 2025 Semester 1"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={mutation.isPending} className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${mutation.isPending ? 'opacity-50' : ''}`}>
          {mutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Create Schedule</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
