import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  position = 'top'
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current
  
  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
    
    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.()
    })
  }
  
  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: '#10B981',
      iconName: 'checkmark-circle',
      text: 'text-green-800'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: '#EF4444',
      iconName: 'alert-circle',
      text: 'text-red-800'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: '#F59E0B',
      iconName: 'warning',
      text: 'text-amber-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: '#3B82F6',
      iconName: 'information-circle',
      text: 'text-blue-800'
    }
  }
  
  const styles = typeStyles[type] || typeStyles.info
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: position === 'top' ? 60 : undefined,
        bottom: position === 'bottom' ? 30 : undefined,
        left: 20,
        right: 20,
        zIndex: 9999,
      }}
    >
      <View className={`flex-row items-center rounded-lg border p-4 shadow-lg ${styles.container}`}>
        <Ionicons 
          name={styles.iconName} 
          size={24} 
          color={styles.icon}
          style={{ marginRight: 12 }}
        />
        
        <Text className={`flex-1 text-sm font-medium ${styles.text}`}>
          {message}
        </Text>
        
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="close" 
            size={20} 
            color={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([])
  
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }
    setToasts(prev => [...prev, newToast])
    
    return id
  }
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  
  const ToastContainer = ({ position = 'top' }) => (
    <>
      {toasts.map((toast, index) => (
        <View
          key={toast.id}
          style={{
            position: 'absolute',
            top: position === 'top' ? 60 + (index * 70) : undefined,
            bottom: position === 'bottom' ? 30 + (index * 70) : undefined,
            left: 0,
            right: 0,
            zIndex: 9999 - index,
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={position}
            onClose={() => removeToast(toast.id)}
          />
        </View>
      ))}
    </>
  )
  
  return {
    showToast,
    showSuccess: (message, duration) => showToast(message, 'success', duration),
    showError: (message, duration) => showToast(message, 'error', duration),
    showWarning: (message, duration) => showToast(message, 'warning', duration),
    showInfo: (message, duration) => showToast(message, 'info', duration),
    ToastContainer,
    removeToast
  }
}
