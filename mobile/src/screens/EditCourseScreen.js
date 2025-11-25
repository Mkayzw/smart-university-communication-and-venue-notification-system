import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

export const EditCourseScreen = ({ navigation, route }) => {
  const { course } = route.params;
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [lecturerOpen, setLecturerOpen] = useState(false);
  
  const [form, setForm] = useState({
    code: course.code,
    name: course.name,
    description: course.description || '',
    credits: course.credits?.toString() || '3',
  });
  const [departmentValue, setDepartmentValue] = useState(course.department);
  const [lecturerValue, setLecturerValue] = useState(course.lecturerId);

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

  const departmentItems = useMemo(() => 
    (departmentsData?.data || []).map(dep => ({ label: dep, value: dep })),
    [departmentsData]
  );

  const lecturerItems = useMemo(() => 
    (lecturersData?.data || []).map(lec => ({ label: `${lec.firstName} ${lec.lastName}`, value: lec.id })),
    [lecturersData]
  );

  const mutation = useMutation({
    mutationFn: (updatedCourse) => apiFetch(`/courses/${course.id}`, {
      method: 'PUT',
      token,
      body: updatedCourse,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['all-courses'], type: 'active' });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to update course.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/courses/${course.id}`, {
      method: 'DELETE',
      token,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['all-courses'], type: 'active' });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to delete course.");
    },
  });

  const handleInputChange = (field, value) => {
    setForm(prevState => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = () => {
    const finalData = {
      ...form,
      department: departmentValue,
      lecturerId: lecturerValue,
      credits: parseInt(form.credits, 10),
    };
    mutation.mutate(finalData);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView 
        className="px-4 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-slate-900 mb-6">Edit Course</Text>
        
        {/* Form Fields */}
        <View className="gap-y-4">
            <View>
                <Text className="text-sm font-semibold text-slate-700 mb-1">Course Code</Text>
                <TextInput
                value={form.code}
                onChangeText={(val) => handleInputChange('code', val)}
                className="bg-white rounded-xl border border-slate-300 p-3"
                />
            </View>
            <View>
                <Text className="text-sm font-semibold text-slate-700 mb-1">Course Name</Text>
                <TextInput
                value={form.name}
                onChangeText={(val) => handleInputChange('name', val)}
                className="bg-white rounded-xl border border-slate-300 p-3"
                />
            </View>
            <View>
                <Text className="text-sm font-semibold text-slate-700 mb-1">Description</Text>
                <TextInput
                value={form.description}
                onChangeText={(val) => handleInputChange('description', val)}
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
                    listMode="MODAL"
                    style={styles.pickerStyle}
                    dropDownContainerStyle={styles.dropDownContainerStyle}
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
                    listMode="MODAL"
                    style={styles.pickerStyle}
                    dropDownContainerStyle={styles.dropDownContainerStyle}
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
          disabled={mutation.isPending || deleteMutation.isPending}
          className={`bg-brand-500 rounded-xl p-4 mt-6 items-center ${(mutation.isPending || deleteMutation.isPending) ? 'opacity-50' : ''}`}
        >
          {mutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Update Course</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteMutation.isPending || mutation.isPending}
          className={`bg-red-500 rounded-xl p-4 mt-2 mb-6 items-center ${(deleteMutation.isPending || mutation.isPending) ? 'opacity-50' : ''}`}
        >
          {deleteMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Delete Course</Text>}
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
