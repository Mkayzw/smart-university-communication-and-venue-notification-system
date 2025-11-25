import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';

export const AnnouncementDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: announcementData, isLoading: announcementLoading, error: announcementError } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => apiFetch(`/announcements/${id}`, { token }),
    enabled: !!token && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/announcements/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['announcements'] });
      navigation.goBack();
    },
    onError: (error) => Alert.alert("Error", error.message || "Failed to delete."),
  });

  const postCommentMutation = useMutation({
    mutationFn: (commentContent) => apiFetch(`/announcements/${id}/comments`, {
      method: 'POST',
      token,
      body: { content: commentContent },
    }),
    onSuccess: () => {
      // Refetch the entire announcement to get the new comment
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      setNewComment('');
    },
    onError: (error) => {
      Alert.alert("Error Posting Comment", error.message || "An unexpected error occurred. Please try again.");
    },
  });

  const handlePostComment = () => {
    if (newComment.trim()) {
      postCommentMutation.mutate(newComment);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Announcement", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
    ]);
  };

  if (announcementLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  if (announcementError) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-red-500">Error fetching announcement details.</Text>
      </SafeAreaView>
    );
  }

  const announcement = announcementData?.data || {};
  const comments = announcement.comments || [];

  const getAuthorName = (author) => {
    if (!author) return 'Anonymous';
    return `${author.firstName || ''} ${author.lastName || ''}`.trim();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="px-4 pt-4">
          <View className="bg-white rounded-2xl p-5 mb-6">
            <View className="flex-row justify-between items-start">
              <Text className="text-2xl font-bold text-slate-900 mb-2 w-4/5">{announcement.title}</Text>
              {isAdmin && (
                <View className="flex-row">
                  <TouchableOpacity onPress={() => navigation.navigate('EditAnnouncement', { announcement })}>
                    <Feather name="edit-2" size={24} color="#334155" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} className="ml-4">
                    <Feather name="trash-2" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text className="text-sm text-slate-500 mb-4">
              Posted by {getAuthorName(announcement.author)} on {new Date(announcement.createdAt).toLocaleDateString()}
            </Text>
            <Text className="text-base text-slate-700 leading-6">{announcement.content}</Text>
          </View>

          <Text className="text-lg font-bold text-slate-900 mb-3">Comments ({comments.length})</Text>

          {comments.length > 0 ? (
            comments.map((comment) => (
              <View key={comment.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
                <Text className="font-bold text-slate-800">{getAuthorName(comment.user)}</Text>
                <Text className="text-slate-600 mt-1">{comment.content}</Text>
              </View>
            ))
          ) : (
            <Text className="text-slate-500 text-center py-4">No comments yet.</Text>
          )}
        </ScrollView>
        <View className="p-4 bg-white border-t border-slate-200">
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write a comment..."
            className="bg-slate-100 rounded-xl px-4 py-3 text-base"
          />
          <TouchableOpacity
            onPress={handlePostComment}
            disabled={postCommentMutation.isPending}
            className={`bg-brand-500 rounded-xl p-3 mt-2 items-center ${postCommentMutation.isPending ? 'opacity-50' : ''}`}
          >
            {postCommentMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Post Comment</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
