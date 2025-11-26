// Extract error message from backend response
const extractErrorMessage = (error) => {
  if (!error) return null
  
  // Try to get message from different possible locations
  if (error.message) return error.message
  if (error.error) return error.error
  if (error.data?.error) return error.data.error
  if (error.data?.message) return error.data.message
  if (error.response?.data?.error) return error.response.data.error
  if (error.response?.data?.message) return error.response.data.message
  
  return null
}

// Error message mapping for user-friendly display
export const getErrorMessage = (error) => {
  // Handle different error types
  if (!error) return 'An unexpected error occurred'
  
  const errorMessage = extractErrorMessage(error) || ''
  const lowerMessage = errorMessage.toLowerCase()
  
  // Network/Connection errors
  if (errorMessage === 'Network request failed' || 
      errorMessage === 'Failed to fetch' ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('network')) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }
  
  if (error.isTimeout || errorMessage.includes('timeout')) {
    return 'Request timed out. The server is taking too long to respond.'
  }
  
  // HTTP status code specific messages
  if (error.status) {
    switch (error.status) {
      case 400:
        // Bad request - check for specific error messages
        if (lowerMessage.includes('password')) {
          return 'Invalid password. Please check your password and try again.'
        }
        if (lowerMessage.includes('email')) {
          if (lowerMessage.includes('already exists') || lowerMessage.includes('already registered')) {
            return 'This email is already registered. Please use a different email.'
          }
          if (lowerMessage.includes('invalid') || lowerMessage.includes('format')) {
            return 'Invalid email format. Please enter a valid email address.'
          }
          return 'Invalid email format or email not found.'
        }
        if (lowerMessage.includes('venue') && lowerMessage.includes('booked')) {
          return 'Venue is already booked for this time slot. Please choose a different time or venue.'
        }
        if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
          return errorMessage || 'This item already exists.'
        }
        if (lowerMessage.includes('required')) {
          return 'Please fill in all required fields.'
        }
        if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
          return errorMessage || 'Invalid data provided. Please check your input.'
        }
        return errorMessage || 'Invalid request. Please check your input.'
        
      case 401:
        if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('wrong password')) {
          return 'Wrong email or password. Please try again.'
        }
        if (lowerMessage.includes('token') || lowerMessage.includes('expired') || lowerMessage.includes('unauthorized')) {
          return 'Your session has expired. Please login again.'
        }
        return 'Authentication failed. Please check your credentials.'
        
      case 403:
        if (lowerMessage.includes('permission') || lowerMessage.includes('authorized')) {
          return errorMessage || 'You do not have permission to perform this action.'
        }
        return 'You do not have permission to perform this action.'
        
      case 404:
        if (lowerMessage.includes('user')) {
          return 'User account not found. Please contact your administrator.'
        }
        if (lowerMessage.includes('course')) {
          return 'Course not found. It may have been deleted.'
        }
        if (lowerMessage.includes('announcement')) {
          return 'Announcement not found. It may have been deleted.'
        }
        if (lowerMessage.includes('schedule')) {
          return 'Schedule not found. It may have been deleted.'
        }
        if (lowerMessage.includes('venue')) {
          return 'Venue not found. It may have been deleted.'
        }
        return errorMessage || 'The requested resource was not found.'
        
      case 409:
        if (lowerMessage.includes('conflict')) {
          return errorMessage || 'A conflict occurred. Please refresh and try again.'
        }
        if (lowerMessage.includes('venue')) {
          return 'Venue scheduling conflict. Please choose a different time or venue.'
        }
        if (lowerMessage.includes('already exists')) {
          return errorMessage || 'This item already exists.'
        }
        return 'A conflict occurred. Please refresh and try again.'
        
      case 422:
        return errorMessage || 'Invalid data provided. Please check all fields and try again.'
        
      case 429:
        return 'Too many attempts. Please wait a moment and try again.'
        
      case 500:
        return 'Server error. Our team has been notified. Please try again later.'
        
      case 502:
      case 503:
        return 'Server is currently unavailable. Please try again in a few moments.'
        
      case 504:
        return 'Server timeout. Please try again.'
        
      default:
        return errorMessage || `An error occurred (Code: ${error.status})`
    }
  }
  
  // Validation errors
  if (lowerMessage.includes('required')) {
    return 'Please fill in all required fields.'
  }
  
  if (lowerMessage.includes('invalid')) {
    return errorMessage || 'Invalid input provided.'
  }
  
  // Default to the error message if available
  return errorMessage || 'An unexpected error occurred. Please try again.'
}

// Error severity levels
export const getErrorSeverity = (error) => {
  if (!error?.status) return 'error'
  
  if (error.status >= 500) return 'critical'
  if (error.status === 401 || error.status === 403) return 'warning'
  if (error.status === 404) return 'info'
  if (error.status === 429) return 'warning'
  
  return 'error'
}

// Determine if error is recoverable
export const isRecoverableError = (error) => {
  if (!error?.status) return true
  
  // Non-recoverable errors
  if (error.status === 401 && error.message?.toLowerCase().includes('token')) {
    return false // Session expired, need to re-login
  }
  
  if (error.status >= 500) {
    return false // Server errors typically need time to resolve
  }
  
  return true
}

// Format field-specific errors
export const getFieldError = (error, fieldName) => {
  if (!error || !fieldName) return null
  
  const message = error.message?.toLowerCase() || ''
  const field = fieldName.toLowerCase()
  
  if (field === 'email' && message.includes('email')) {
    if (message.includes('already exists')) {
      return 'This email is already registered'
    }
    if (message.includes('invalid')) {
      return 'Please enter a valid email address'
    }
    if (message.includes('not found')) {
      return 'No account found with this email'
    }
  }
  
  if (field === 'password' && message.includes('password')) {
    if (message.includes('must be at least')) {
      return 'Password must be at least 8 characters'
    }
    if (message.includes('invalid') || message.includes('wrong')) {
      return 'Incorrect password'
    }
  }
  
  return null
}

// Action suggestions based on error
export const getErrorAction = (error) => {
  if (!error) return null
  
  if (error.message?.toLowerCase().includes('network') || error.message === 'Network request failed') {
    return {
      text: 'Retry',
      action: 'retry'
    }
  }
  
  if (error.status === 401) {
    return {
      text: 'Login',
      action: 'login'
    }
  }
  
  if (error.status === 404) {
    return {
      text: 'Go Back',
      action: 'back'
    }
  }
  
  if (error.isTimeout) {
    return {
      text: 'Try Again',
      action: 'retry'
    }
  }
  
  return null
}
