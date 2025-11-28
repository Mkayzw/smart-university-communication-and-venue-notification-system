// Import React Query hooks for data fetching and caching
import { useMutation, useQuery } from '@tanstack/react-query'
// Import authentication hook for token access
import { useAuth } from './useAuth.js'
// Import API client for making HTTP requests
import { apiFetch } from '../utils/apiClient.js'

// Custom hook for GET requests using React Query
export const useApiQuery = (path, options = {}) => {
  const { token, isAuthenticated } = useAuth()

  // Handle enabled property properly - if it's a boolean, use it directly
  // If it's a function, call it with the context
  let enabledValue = true
  if (typeof options.enabled === 'boolean') {
    enabledValue = options.enabled
  } else if (typeof options.enabled === 'function') {
    enabledValue = options.enabled()
  } else {
    enabledValue = options.enabled ?? true
  }

  return useQuery({
    queryKey: options.queryKey ?? ['api', path, options.params],
    queryFn: ({ signal }) =>
      apiFetch(path, {
        method: options.method,
        params: options.params,
        body: options.body,
        token,
        signal
      }),
    enabled: enabledValue && !!token && isAuthenticated,
    ...options
  })
}

// Custom hook for POST/PUT/DELETE requests using React Query mutations
export const useApiMutation = (path, options = {}) => {
  const { token } = useAuth()

  return useMutation({
    mutationKey: options.mutationKey ?? ['api', path],
    mutationFn: async (variables) => {
      // Support dynamic path functions
      if (typeof path === 'function') {
        return path({ token, variables })
      }

      // Build request configuration if custom function provided
      const config = typeof options.buildRequest === 'function' ? options.buildRequest(variables) : {}

      return apiFetch(path, {
        method: config.method || options.method || 'POST',
        params: config.params || options.params,
        body: config.body ?? variables,
        token,
        headers: config.headers || options.headers
      })
    },
    ...options
  })
}
