import { config } from '../config'

export const apiFetch = async (path, options = {}) => {
  const { method = 'GET', body, token, timeout = 10000 } = options

  const url = `${config.API_URL}${path}`
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 204) {
      return null
    }

    let data
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : null
    } catch (parseError) {
      // If response is not JSON, create a simple error
      data = { message: 'Invalid response from server' }
    }

    if (!response.ok) {
      // Extract error message from various possible locations
      const errorMessage = data?.error || 
                          data?.message || 
                          data?.data?.error ||
                          data?.data?.message ||
                          `Request failed with status ${response.status}`
      
      const error = new Error(errorMessage)
      error.status = response.status
      error.data = data
      error.response = response
      throw error
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    
    if (err.name === 'AbortError') {
      const error = new Error('Request timeout')
      error.isTimeout = true
      error.status = 504
      throw error
    }
    
    // If it's already our custom error, re-throw it
    if (err.status) {
      throw err
    }
    
    // Handle network errors
    if (err.message === 'Network request failed' || 
        err.message === 'Failed to fetch' ||
        !err.message) {
      const networkError = new Error('Network request failed')
      networkError.status = 0
      networkError.isNetworkError = true
      throw networkError
    }
    
    throw err
  }
}

