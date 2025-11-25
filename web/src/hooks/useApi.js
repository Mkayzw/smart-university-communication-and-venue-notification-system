import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth.js'
import { apiFetch } from '../utils/apiClient.js'

export const useApiQuery = (path, options = {}) => {
  const { token, isAuthenticated } = useAuth()

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
    enabled: (options.enabled ?? true) && !!token && isAuthenticated,
    ...options
  })
}

export const useApiMutation = (path, options = {}) => {
  const { token } = useAuth()

  return useMutation({
    mutationKey: options.mutationKey ?? ['api', path],
    mutationFn: async (variables) => {
      if (typeof path === 'function') {
        return path({ token, variables })
      }

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
