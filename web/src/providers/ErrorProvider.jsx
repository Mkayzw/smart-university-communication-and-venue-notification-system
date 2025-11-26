import { createContext, useContext, useState, useCallback } from 'react'
import { Toast, useToast } from '../components/feedback/Toast'
import { getErrorMessage } from '../utils/errorHandler'

const ErrorContext = createContext(null)

export const ErrorProvider = ({ children }) => {
  const { showError, showSuccess, showWarning, showInfo, ToastContainer } = useToast()
  const [globalError, setGlobalError] = useState(null)
  
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
  
  const handleSuccess = useCallback((message, duration = 3000) => {
    showSuccess(message, duration)
  }, [showSuccess])
  
  const handleWarning = useCallback((message, duration = 4000) => {
    showWarning(message, duration)
  }, [showWarning])
  
  const handleInfo = useCallback((message, duration = 3000) => {
    showInfo(message, duration)
  }, [showInfo])
  
  const clearGlobalError = useCallback(() => {
    setGlobalError(null)
  }, [])
  
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

export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}
