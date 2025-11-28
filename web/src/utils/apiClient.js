// Resolve API base URL from environment variables or fallback to localhost
const resolveApiBaseUrl = () => {
  const rawBase =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000'

  // Remove trailing slash for consistency
  const normalized = rawBase.replace(/\/$/, '')
  // Ensure API path is included
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

const API_BASE_URL = resolveApiBaseUrl()

// Check if value is null, undefined, or empty string
const isNil = (value) => value === undefined || value === null || value === ''

// Build complete URL with query parameters
const buildUrl = (path, params) => {
  // Ensure path starts with forward slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${cleanPath}`)
  
  // Add query parameters if provided
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle array parameters by adding each non-nil value
        value.filter((v) => !isNil(v)).forEach((entry) => url.searchParams.append(key, entry))
      } else if (!isNil(value)) {
        // Handle single parameters
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

// Enhanced fetch wrapper for API requests with authentication and error handling
export const apiFetch = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    token,
    params,
    headers: customHeaders,
    signal
  } = options

  // Build URL with query parameters
  const url = buildUrl(path, params)

  // Set default headers
  const headers = new Headers({
    Accept: 'application/json',
    ...customHeaders
  })

  // Set content type for non-FormData requests
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Add authorization token if provided
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Make the API request
  const response = await fetch(url, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    signal
  })

  // Handle No Content response
  if (response.status === 204) {
    return null
  }

  // Parse response based on content type
  const contentType = response.headers.get('Content-Type')
  const isJson = contentType?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  // Handle error responses
  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || response.statusText
    const error = new Error(errorMessage || 'Request failed')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
