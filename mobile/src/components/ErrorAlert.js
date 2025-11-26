import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getErrorSeverity, getErrorAction, getErrorMessage } from '../utils/errorHandler'

export const ErrorAlert = ({ 
  error, 
  message, 
  onDismiss, 
  onAction,
  showIcon = true,
  dismissible = true,
  actionButton = true,
  style = {}
}) => {
  if (!error && !message) return null
  
  const severity = getErrorSeverity(error)
  const action = actionButton ? getErrorAction(error) : null
  const displayMessage = message || getErrorMessage(error) || 'An error occurred'
  
  const severityStyles = {
    info: {
      backgroundColor: '#DBEAFE',
      borderColor: '#93C5FD',
      textColor: '#1E40AF',
      iconColor: '#3B82F6',
      buttonColor: '#BFDBFE'
    },
    warning: {
      backgroundColor: '#FEF3C7',
      borderColor: '#FDE68A',
      textColor: '#92400E',
      iconColor: '#F59E0B',
      buttonColor: '#FDE68A'
    },
    error: {
      backgroundColor: '#FEE2E2',
      borderColor: '#FECACA',
      textColor: '#991B1B',
      iconColor: '#EF4444',
      buttonColor: '#FECACA'
    },
    critical: {
      backgroundColor: '#FEE2E2',
      borderColor: '#FCA5A5',
      textColor: '#7F1D1D',
      iconColor: '#DC2626',
      buttonColor: '#FCA5A5'
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
    <View 
      style={[
        alertStyles.container,
        {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
        },
        style
      ]}
    >
      <View style={alertStyles.content}>
        {showIcon && (
          <View style={alertStyles.iconContainer}>
            <Ionicons 
              name={getIconName()} 
              size={24} 
              color={styles.iconColor}
            />
          </View>
        )}
        
        <View style={alertStyles.textContainer}>
          <Text style={[alertStyles.text, { color: styles.textColor }]}>
            {displayMessage}
          </Text>
          
          {action && onAction && (
            <TouchableOpacity
              onPress={handleAction}
              style={[
                alertStyles.button,
                { backgroundColor: styles.buttonColor }
              ]}
            >
              <Text style={[alertStyles.buttonText, { color: styles.textColor }]}>
                {action.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {dismissible && onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={alertStyles.dismissButton}
          >
            <Ionicons 
              name="close" 
              size={20} 
              color={styles.iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const alertStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
})