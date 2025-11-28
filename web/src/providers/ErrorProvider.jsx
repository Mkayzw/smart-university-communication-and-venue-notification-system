// Import React hooks for context and state management
import { createContext, useContext, useState, useCallback } from 'react'
// Import Toast components for user notifications
import { Toast, useToast } from '../components/feedback/Toast'
// Import error message utility for user-friendly error display
import { getErrorMessage } from '../utils/errorHandler'

// Create error context
const ErrorContext = createContext(null)

// Error provider component for centralized error handling
export const ErrorProvider = ({ children }) => {
  const { showError, showSuccess, showWarning, showInfo, ToastContainer } = useToast()
  const [globalError, setGlobalError] = useState(null)
  
  // Handle errors with user-friendly messages and toast notifications
  const handleError = useCallback((error, options = {}) => {
    const {
      showToast = true,
      duration = 5000,
      fallbackMessage = 'An error occurred'
    } = options
    
    const message = getErrorMessage(error) || fallbackMessage
    
    if (showToast) {
      showError(message, duration)
    }
    
    // Log error for debugging
    console.error('Application Error:', error)
    
    // Set global error if it's critical
    if (error?.status >= 500 || error?.status === 401) {
      setGlobalError(error)
    }
    
    return message
  }, [showError])
  
  // Show success toast notification
  const handleSuccess = useCallback((message, duration = 3000) => {
    showSuccess(message, duration)
  }, [showSuccess])
  
  // Show warning toast notification
  const handleWarning = useCallback((message, duration = 4000) => {
    showWarning(message, duration)
  }, [showWarning])
  
  // Show info toast notification
  const handleInfo = useCallback((message, duration = 3000) => {
    showInfo(message, duration)
  }, [showInfo])
  
  // Clear global error state
  const clearGlobalError = useCallback(() => {
    setGlobalError(null)
  }, [])
  
  // Context value object
  const value = {
    globalError,
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    clearGlobalError
  }
  
  return (
    <ErrorContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ErrorContext.Provider>
  )
}

// Hook to access error context
export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}
