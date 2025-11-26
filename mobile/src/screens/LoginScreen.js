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
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage, getFieldError } from '../utils/errorHandler'
import { ErrorAlert } from '../components/ErrorAlert'

export const LoginScreen = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Client-side validation
    const newFieldErrors = {}
    
    if (!email) {
      newFieldErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      newFieldErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters'
    }
    
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    
    try {
      await login({ email, password })
    } catch (err) {
      // Check for field-specific errors
      const emailError = getFieldError(err, 'email')
      const passwordError = getFieldError(err, 'password')
      
      if (emailError || passwordError) {
        setFieldErrors({
          email: emailError,
          password: passwordError
        })
      } else {
        // Use the enhanced error message handler
        setError(getErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEmailChange = (text) => {
    setEmail(text)
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: null }))
    }
    if (error) setError(null)
  }
  
  const handlePasswordChange = (text) => {
    setPassword(text)
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: null }))
    }
    if (error) setError(null)
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
                <View>
                  <TextInput
                    className={`w-full rounded-xl border ${fieldErrors.email ? 'border-red-400' : 'border-slate-300'} bg-white px-4 py-3 text-base text-slate-900`}
                    placeholder="name@university.edu"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={handleEmailChange}
                    editable={!isSubmitting}
                  />
                  {fieldErrors.email && (
                    <View className="flex-row items-center gap-1 mt-1 px-1">
                      <Ionicons name="alert-circle" size={12} color="#EF4444" />
                      <Text className="text-xs text-red-600">{fieldErrors.email}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-slate-700">Password</Text>
                <View>
                  <TextInput
                    className={`w-full rounded-xl border ${fieldErrors.password ? 'border-red-400' : 'border-slate-300'} bg-white px-4 py-3 text-base text-slate-900`}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    value={password}
                    onChangeText={handlePasswordChange}
                    editable={!isSubmitting}
                  />
                  {fieldErrors.password && (
                    <View className="flex-row items-center gap-1 mt-1 px-1">
                      <Ionicons name="alert-circle" size={12} color="#EF4444" />
                      <Text className="text-xs text-red-600">{fieldErrors.password}</Text>
                    </View>
                  )}
                </View>
              </View>

              {error && (
                <ErrorAlert 
                  error={{ message: error }}
                  onDismiss={() => setError(null)}
                  onAction={(action) => {
                    if (action === 'retry') {
                      handleSubmit()
                    }
                  }}
                />
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
