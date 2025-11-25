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

    const data = await response.json()

    if (!response.ok) {
      const error = new Error(data?.error || data?.message || 'Request failed')
      error.status = response.status
      throw error
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    
    if (err.name === 'AbortError') {
      const error = new Error('Request timeout')
      error.isTimeout = true
      throw error
    }
    
    throw err
  }
}

