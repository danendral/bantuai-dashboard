import { createContext, useContext, useState, useEffect } from 'react'
import { AUTH_STORAGE_KEY, validateCredentials } from '../lib/auth-config'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  function login(email, password) {
    const result = validateCredentials(email, password)
    if (!result) return { success: false, error: 'Invalid email or password' }
    setUser(result)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result))
    return { success: true }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
