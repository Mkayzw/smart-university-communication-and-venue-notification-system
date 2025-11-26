// Error message mapping for user-friendly display
export const getErrorMessage = (error) => {
  // Handle different error types
  if (!error) return 'An unexpected error occurred'
  
  // Network/Connection errors
  if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
    return 'Unable to connect to the server. Please check your internet connection.'
  }
  
  if (error.isTimeout) {
    return 'Request timed out. The server is taking too long to respond.'
  }
  
  // HTTP status code specific messages
  if (error.status) {
    switch (error.status) {
      case 400:
        // Bad request - check for specific error messages
        if (error.message?.toLowerCase().includes('password')) {
          return 'Invalid password. Please check your password and try again.'
        }
        if (error.message?.toLowerCase().includes('email')) {
          return 'Invalid email format or email not found.'
        }
        if (error.message?.toLowerCase().includes('already exists')) {
          return error.message
        }
        return error.message || 'Invalid request. Please check your input.'
        
      case 401:
        if (error.message?.toLowerCase().includes('invalid credentials')) {
          return 'Wrong email or password. Please try again.'
        }
        if (error.message?.toLowerCase().includes('token')) {
          return 'Your session has expired. Please login again.'
        }
        return 'Authentication failed. Please check your credentials.'
        
      case 403:
        return 'You do not have permission to perform this action.'
        
      case 404:
        if (error.message?.toLowerCase().includes('user')) {
          return 'User account not found. Please contact your administrator.'
        }
        if (error.message?.toLowerCase().includes('course')) {
          return 'Course not found. It may have been deleted.'
        }
        if (error.message?.toLowerCase().includes('announcement')) {
          return 'Announcement not found. It may have been deleted.'
        }
        return error.message || 'The requested resource was not found.'
        
      case 409:
        if (error.message?.toLowerCase().includes('conflict')) {
          return error.message
        }
        if (error.message?.toLowerCase().includes('venue')) {
          return 'Venue scheduling conflict. Please choose a different time or venue.'
        }
        return 'A conflict occurred. Please refresh and try again.'
        
      case 422:
        return 'Invalid data provided. Please check all fields and try again.'
        
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
        return error.message || `An error occurred (Code: ${error.status})`
    }
  }
  
  // Validation errors
  if (error.message?.toLowerCase().includes('required')) {
    return 'Please fill in all required fields.'
  }
  
  if (error.message?.toLowerCase().includes('invalid')) {
    return error.message
  }
  
  // Default to the error message if available
  return error.message || 'An unexpected error occurred. Please try again.'
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
