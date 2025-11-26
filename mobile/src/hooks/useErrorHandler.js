import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { getErrorMessage, getErrorAction, isRecoverableError } from '../utils/errorHandler'

/**
 * Hook for handling errors in React Native components
 * Provides consistent error handling with user-friendly messages
 */
export const useErrorHandler = (options = {}) => {
  const {
    showAlert = true,
    showToast = false,
    toastHook = null,
    onError = null,
    defaultMessage = 'An error occurred'
  } = options

  const [error, setError] = useState(null)
  const [isError, setIsError] = useState(false)

  const handleError = useCallback((err, customMessage = null) => {
    const errorMessage = customMessage || getErrorMessage(err) || defaultMessage
    const action = getErrorAction(err)
    const recoverable = isRecoverableError(err)

    setError({
      ...err,
      userMessage: errorMessage,
      action,
      recoverable
    })
    setIsError(true)

    // Show alert if enabled
    if (showAlert) {
      const buttons = []
      
      if (action) {
        buttons.push({
          text: action.text,
          onPress: () => {
            if (options.onAction) {
              options.onAction(action.action)
            }
          }
        })
      }
      
      buttons.push({
        text: 'OK',
        style: 'default'
      })

      Alert.alert(
        'Error',
        errorMessage,
        buttons,
        { cancelable: true }
      )
    }

    // Show toast if enabled and toast hook provided
    if (showToast && toastHook) {
      toastHook.showError(errorMessage)
    }

    // Call custom error handler if provided
    if (onError) {
      onError(err, errorMessage)
    }
  }, [showAlert, showToast, toastHook, onError, defaultMessage, options])

  const clearError = useCallback(() => {
    setError(null)
    setIsError(false)
  }, [])

  const handleAction = useCallback((actionType) => {
    if (options.onAction) {
      options.onAction(actionType)
    }
    clearError()
  }, [options, clearError])

  return {
    error,
    isError,
    handleError,
    clearError,
    handleAction,
    errorMessage: error?.userMessage || null
  }
}

/**
 * Hook for handling async operations with error handling
 */
export const useAsyncErrorHandler = (asyncFn, options = {}) => {
  const errorHandler = useErrorHandler(options)
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(async (...args) => {
    try {
      setIsLoading(true)
      errorHandler.clearError()
      const result = await asyncFn(...args)
      return result
    } catch (err) {
      errorHandler.handleError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [asyncFn, errorHandler])

  return {
    execute,
    isLoading,
    ...errorHandler
  }
}
