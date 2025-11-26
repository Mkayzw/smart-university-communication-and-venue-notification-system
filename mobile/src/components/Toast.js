import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  position = 'top'
}) => {
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(-100))
  
  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
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
  }, [duration])
  
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.()
    })
  }
  
  const typeStyles = {
    success: {
      backgroundColor: '#D1FAE5',
      borderColor: '#10B981',
      iconColor: '#10B981',
      textColor: '#065F46',
      iconName: 'checkmark-circle'
    },
    error: {
      backgroundColor: '#FEE2E2',
      borderColor: '#EF4444',
      iconColor: '#EF4444',
      textColor: '#991B1B',
      iconName: 'alert-circle'
    },
    warning: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      iconColor: '#F59E0B',
      textColor: '#92400E',
      iconName: 'warning'
    },
    info: {
      backgroundColor: '#DBEAFE',
      borderColor: '#3B82F6',
      iconColor: '#3B82F6',
      textColor: '#1E40AF',
      iconName: 'information-circle'
    }
  }
  
  const styles = typeStyles[type] || typeStyles.info
  
  const positionStyles = {
    top: { top: 50 },
    bottom: { bottom: 50 },
    center: { top: '50%', marginTop: -30 }
  }
  
  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          ...positionStyles[position],
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={toastStyles.content}>
        <Ionicons 
          name={styles.iconName} 
          size={24} 
          color={styles.iconColor}
          style={toastStyles.icon}
        />
        
        <Text style={[toastStyles.text, { color: styles.textColor }]}>
          {message}
        </Text>
        
        <TouchableOpacity
          onPress={handleClose}
          style={toastStyles.closeButton}
        >
          <Ionicons 
            name="close" 
            size={18} 
            color={styles.iconColor}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
})

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([])
  
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    setToasts(prev => [...prev, newToast])
    
    return id
  }
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  
  const ToastContainer = ({ position = 'top' }) => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          position={position}
        />
      ))}
    </>
  )
  
  return {
    showToast,
    showSuccess: (message, duration) => showToast(message, 'success', duration),
    showError: (message, duration) => showToast(message, 'error', duration),
    showWarning: (message, duration) => showToast(message, 'warning', duration),
    showInfo: (message, duration) => showToast(message, 'info', duration),
    ToastContainer
  }
}