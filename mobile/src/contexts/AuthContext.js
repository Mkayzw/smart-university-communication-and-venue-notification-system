import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { apiFetch } from '../utils/apiClient'
import { initializeSocket, disconnectSocket } from '../utils/socket'

const AuthContext = createContext(null)

const STORAGE_KEY = 'smart-uni-auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    loadStoredAuth()
  }, [])

  const loadStoredAuth = async () => {
    try {
      const cached = await SecureStore.getItemAsync(STORAGE_KEY)
      if (!cached) {
        setStatus('unauthenticated')
        return
      }

      const parsed = JSON.parse(cached)
      if (!parsed?.token) {
        throw new Error('Invalid cache')
      }

      setToken(parsed.token)
      setStatus('loading')

      const profileResponse = await apiFetch('/auth/me', {
        token: parsed.token,
        timeout: 5000
      })
      
      const profile = profileResponse?.data || profileResponse
      setUser({
        ...profile,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
      })
      setStatus('authenticated')
      
      // Initialize Socket.IO connection
      initializeSocket(parsed.token)
    } catch (err) {
      console.error('Auth error:', err)
      await SecureStore.deleteItemAsync(STORAGE_KEY)
      setToken(null)
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  const login = async ({ email, password }) => {
    setStatus('loading')
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      const payload = res?.data || res
      const nextToken = payload?.token
      const nextUser = payload?.user

      if (!nextToken || !nextUser) {
        throw new Error('Invalid response from server')
      }

      setToken(nextToken)
      setUser({
        ...nextUser,
        name: `${nextUser.firstName} ${nextUser.lastName}`.trim(),
      })
      setStatus('authenticated')
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ token: nextToken }))
      
      // Initialize Socket.IO connection
      initializeSocket(nextToken)
      
      return nextUser
    } catch (err) {
      setStatus('unauthenticated')
      throw err
    }
  }

  const logout = async () => {
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
    
    // Disconnect Socket.IO connection
    disconnectSocket()
    
    await SecureStore.deleteItemAsync(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        status,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading' || status === 'checking',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

