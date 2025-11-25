const resolveApiBaseUrl = () => {
  const rawBase =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000'

  const normalized = rawBase.replace(/\/$/, '')
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

const API_BASE_URL = resolveApiBaseUrl()

const isNil = (value) => value === undefined || value === null || value === ''

const buildUrl = (path, params) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${cleanPath}`)
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.filter((v) => !isNil(v)).forEach((entry) => url.searchParams.append(key, entry))
      } else if (!isNil(value)) {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

export const apiFetch = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    token,
    params,
    headers: customHeaders,
    signal
  } = options

  const url = buildUrl(path, params)

  const headers = new Headers({
    Accept: 'application/json',
    ...customHeaders
  })

  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    signal
  })

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('Content-Type')
  const isJson = contentType?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || response.statusText
    const error = new Error(errorMessage || 'Request failed')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
