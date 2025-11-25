import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

export const CreateCourseScreen = ({ navigation }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [departmentValue, setDepartmentValue] = useState(null);
  const [lecturerOpen, setLecturerOpen] = useState(false);
  const [lecturerValue, setLecturerValue] = useState(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    credits: '3',
  });

  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiFetch('/courses/departments', { token }),
    enabled: !!token,
  });

  const { data: lecturersData, isLoading: lecturersLoading } = useQuery({
    queryKey: ['lecturers'],
    queryFn: () => apiFetch('/users', { token, params: { role: 'LECTURER', limit: 1000 } }),
    enabled: !!token,
  });

  const departmentItems = useMemo(() => {
    return (departmentsData?.data || []).map(dep => ({
      label: dep,
      value: dep,
    }));
  }, [departmentsData]);

  const lecturerItems = useMemo(() => {
    return (lecturersData?.data || []).map(lec => ({
      label: `${lec.firstName} ${lec.lastName}`,
      value: lec.id,
    }));
  }, [lecturersData]);

  const mutation = useMutation({
    mutationFn: (newCourse) => apiFetch('/courses', {
      method: 'POST',
      token,
      body: newCourse,
    }),
    onSuccess: () => {
      // Invalidate and refetch to ensure the list is updated immediately on navigating back
      queryClient.refetchQueries({ queryKey: ['all-courses'], type: 'active' });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to create course.");
    },
  });

  const handleInputChange = (field, value) => {
    setForm(prevState => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = () => {
    if (!departmentValue) {
      Alert.alert("Validation Error", "Please select a department.");
      return;
    }
    if (!lecturerValue) {
      Alert.alert("Validation Error", "Please assign a lecturer.");
      return;
    }
    const finalData = {
      ...form,
      department: departmentValue,
      lecturerId: lecturerValue,
      credits: parseInt(form.credits, 10),
    };
    mutation.mutate(finalData);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView 
        className="px-4 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-slate-900 mb-6">Create New Course</Text>

        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Course Code</Text>
            <TextInput
              value={form.code}
              onChangeText={(val) => handleInputChange('code', val)}
              placeholder="e.g., CSC101"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Course Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(val) => handleInputChange('name', val)}
              placeholder="e.g., Introduction to Programming"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Description</Text>
            <TextInput
              value={form.description}
              onChangeText={(val) => handleInputChange('description', val)}
              placeholder="A brief summary of the course..."
              multiline
              numberOfLines={4}
              className="bg-white rounded-xl border border-slate-300 p-3 h-24"
            />
          </View>

          <View style={{ zIndex: 2000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Department</Text>
            <DropDownPicker
              open={departmentOpen}
              value={departmentValue}
              items={departmentItems}
              setOpen={setDepartmentOpen}
              setValue={setDepartmentValue}
              loading={departmentsLoading}
              searchable={true}
              placeholder="Select a department..."
              listMode={Platform.OS === 'ios' ? 'MODAL' : 'SCROLLVIEW'}
              style={styles.pickerStyle}
              dropDownContainerStyle={styles.dropDownContainerStyle}
              zIndex={2000}
              zIndexInverse={1000}
            />
          </View>

          <View style={{ zIndex: 1000 }}>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Assign Lecturer</Text>
            <DropDownPicker
              open={lecturerOpen}
              value={lecturerValue}
              items={lecturerItems}
              setOpen={setLecturerOpen}
              setValue={setLecturerValue}
              loading={lecturersLoading}
              searchable={true}
              placeholder="Select a lecturer..."
              listMode={Platform.OS === 'ios' ? 'MODAL' : 'SCROLLVIEW'}
              style={styles.pickerStyle}
              dropDownContainerStyle={styles.dropDownContainerStyle}
              zIndex={1000}
              zIndexInverse={2000}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1">Credits</Text>
            <TextInput
              value={form.credits}
              onChangeText={(val) => handleInputChange('credits', val)}
              keyboardType="numeric"
              className="bg-white rounded-xl border border-slate-300 p-3"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${mutation.isPending ? 'opacity-50' : ''}`}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Create Course</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pickerStyle: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
  dropDownContainerStyle: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
});
