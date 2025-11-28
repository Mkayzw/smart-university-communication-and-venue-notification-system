// Import React hooks for state management and memoization
import { useState, useCallback } from 'react'
// Import authentication hook for token access
import { useAuth } from './useAuth'
// Import API client for making HTTP requests
import { apiFetch } from '../utils/apiClient'
// Import error handling provider for user feedback
import { useError } from '../providers/ErrorProvider'

// Custom hook for API calls with built-in error handling and loading states
export const useApiWithErrorHandling = () => {
  const { token } = useAuth()
  const { handleError, handleSuccess } = useError()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Generic API call function with error handling
  const apiCall = useCallback(async (path, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFetch(path, {
        ...options,
        token: options.token || token
      })
      
      // Show success message if provided
      if (options.successMessage) {
        handleSuccess(options.successMessage)
      }
      
      return result
    } catch (err) {
      setError(err)
      
      // Handle error display based on options
      if (options.showErrorToast !== false) {
        handleError(err, {
          showToast: true,
          duration: options.errorDuration || 5000,
          fallbackMessage: options.errorMessage
        })
      }
      
      // Re-throw if caller wants to handle it
      if (options.rethrow) {
        throw err
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [token, handleError, handleSuccess])
  
  // HTTP method helpers
  const get = useCallback((path, options = {}) => {
    return apiCall(path, { ...options, method: 'GET' })
  }, [apiCall])
  
  const post = useCallback((path, body, options = {}) => {
    return apiCall(path, { ...options, method: 'POST', body })
  }, [apiCall])
  
  const put = useCallback((path, body, options = {}) => {
    return apiCall(path, { ...options, method: 'PUT', body })
  }, [apiCall])
  
  const patch = useCallback((path, body, options = {}) => {
    return apiCall(path, { ...options, method: 'PATCH', body })
  }, [apiCall])
  
  const del = useCallback((path, options = {}) => {
    return apiCall(path, { ...options, method: 'DELETE' })
  }, [apiCall])
  
  return {
    loading,
    error,
    get,
    post,
    put,
    patch,
    delete: del,
    apiCall
  }
}

// Example usage in a component:
/*
const MyComponent = () => {
  const api = useApiWithErrorHandling()
  
  const handleCreateCourse = async (courseData) => {
    const result = await api.post('/courses', courseData, {
      successMessage: 'Course created successfully!',
      errorMessage: 'Failed to create course'
    })
    
    if (result) {
      // Handle success
      console.log('Course created:', result)
    }
  }
  
  const handleDeleteCourse = async (courseId) => {
    const result = await api.delete(`/courses/${courseId}`, {
      successMessage: 'Course deleted successfully!',
      showErrorToast: true,
      rethrow: false // Don't re-throw the error
    })
    
    if (result !== null) {
      // Handle success
      refreshCourses()
    }
  }
  
  return (
    <div>
      {api.loading && <Spinner />}
      // Your component JSX
    </div>
  )
}
*/
