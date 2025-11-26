import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getErrorSeverity, getErrorAction } from '../utils/errorHandler'

export const ErrorAlert = ({ 
  error, 
  message, 
  onDismiss, 
  onAction,
  showIcon = true,
  dismissible = true,
  actionButton = true,
  className = ''
}) => {
  if (!error && !message) return null
  
  const severity = getErrorSeverity(error)
  const action = actionButton ? getErrorAction(error) : null
  const displayMessage = message || error?.message || 'An error occurred'
  
  const severityStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: '#3B82F6',
      button: 'bg-blue-100'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: '#F59E0B',
      button: 'bg-amber-100'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '#EF4444',
      button: 'bg-red-100'
    },
    critical: {
      container: 'bg-red-100 border-red-300',
      text: 'text-red-900',
      icon: '#DC2626',
      button: 'bg-red-200'
    }
  }
  
  const styles = severityStyles[severity] || severityStyles.error
  
  const getIconName = () => {
    switch (severity) {
      case 'info':
        return 'information-circle'
      case 'warning':
        return 'warning'
      case 'critical':
        return 'alert-circle'
      default:
        return 'alert-circle'
    }
  }
  
  const handleAction = () => {
    if (!action || !onAction) return
    onAction(action.action)
  }
  
  return (
    <View className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <View className="flex-row">
        {showIcon && (
          <View className="mr-3">
            <Ionicons 
              name={getIconName()} 
              size={24} 
              color={styles.icon}
            />
          </View>
        )}
        
        <View className="flex-1">
          <Text className={`text-sm font-medium ${styles.text}`}>
            {displayMessage}
          </Text>
          
          {action && onAction && (
            <TouchableOpacity
              onPress={handleAction}
              className={`mt-2 px-3 py-1 rounded-md self-start ${styles.button}`}
            >
              <Text className={`text-sm font-semibold ${styles.text}`}>
                {action.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {dismissible && onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            className="ml-4"
          >
            <Ionicons 
              name="close" 
              size={20} 
              color={styles.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
