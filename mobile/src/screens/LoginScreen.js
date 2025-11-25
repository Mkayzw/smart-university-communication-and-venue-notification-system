import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'

export const LoginScreen = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Logo */}
            <View className="items-center mb-8">
              <View className="bg-brand-500 rounded-2xl h-16 w-16 items-center justify-center mb-4">
                <Text className="text-xl font-bold text-white">SU</Text>
              </View>
              <Text className="text-3xl font-bold text-slate-900">Smart Uni Hub</Text>
              <Text className="text-sm font-medium text-slate-500 mt-2 text-center">
                Sign in to access announcements, schedules, and more
              </Text>
            </View>

            {/* Form */}
            <View className="gap-5">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-slate-700">Email</Text>
                <TextInput
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                  placeholder="name@university.edu"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isSubmitting}
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-slate-700">Password</Text>
                <TextInput
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isSubmitting}
                />
              </View>

              {error && (
                <View className="rounded-xl border border-orange-400 bg-orange-100 px-4 py-3">
                  <Text className="text-sm font-semibold text-orange-700">{error}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`w-full rounded-xl bg-brand-500 px-4 py-4 items-center ${isSubmitting ? 'opacity-70' : ''}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Sign in</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text className="mt-6 text-center text-xs font-medium text-slate-400">
              Need an account? Contact your administrator.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
