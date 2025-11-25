import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/apiClient.js'
import { initializeSocket, disconnectSocket } from '../utils/socket.js'

const AuthContext = createContext(null)

const STORAGE_KEY = 'smart-uni-auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const cached = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!cached) {
      setStatus('unauthenticated')
      return
    }

    try {
      const parsed = JSON.parse(cached)
      if (!parsed?.token) {
        throw new Error('bad cache')
      }
      setToken(parsed.token)
      setStatus('loading')
      apiFetch('/auth/me', { token: parsed.token })
        .then((profileResponse) => {
          const profile = profileResponse?.data || profileResponse
          setUser(profile)
          setStatus('authenticated')
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY)
          setToken(null)
          setUser(null)
          setStatus('unauthenticated')
        })
    } catch (err) {
      console.error('auth cache busted', err)
      localStorage.removeItem(STORAGE_KEY)
      setStatus('unauthenticated')
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setStatus('loading')
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    const payload = res?.data || res
    const nextToken = payload?.token
    const nextUser = payload?.user

    if (!nextToken || !nextUser) {
      throw new Error('Backend sent a weird auth payload')
    }

    setToken(nextToken)
    setUser(nextUser)
    setStatus('authenticated')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken }))
    
    // Initialize Socket.IO connection
    initializeSocket(nextToken)
    
    return nextUser
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
    localStorage.removeItem(STORAGE_KEY)
    
    // Disconnect Socket.IO connection
    disconnectSocket()
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading' || status === 'checking',
      login,
      logout,
      setUser
    }),
    [user, token, status, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must sit inside AuthProvider')
  }
  return ctx
}
