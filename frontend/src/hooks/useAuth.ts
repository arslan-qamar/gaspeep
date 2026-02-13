import { useEffect, useState } from 'react'
import { User, authService } from '../services/authService'

// Module-level cache + pending fetch to dedupe concurrent callers
let cachedUser: User | null = null
let cachedError: string | null = null
let pendingFetch: Promise<User> | null = null

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState<boolean>(() => (cachedUser === null && !!localStorage.getItem('auth_token')))
  const [error, setError] = useState<string | null>(cachedError)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }

    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
      return
    }

    if (pendingFetch) {
      pendingFetch
        .then((u) => setUser(u))
        .catch((err) => {
          setError(err.message)
          localStorage.removeItem('auth_token')
        })
        .finally(() => setLoading(false))
      return
    }

    pendingFetch = authService
      .getCurrentUser()
      .then((u) => {
        cachedUser = u
        setUser(u)
        return u
      })
      .catch((err) => {
        cachedError = err.message
        localStorage.removeItem('auth_token')
        setError(err.message)
        throw err
      })
      .finally(() => {
        pendingFetch = null
        setLoading(false)
      })

    return () => {
      // No-op cleanup; subscribers simply unmount
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { token, user } = await authService.signin(email, password)
      localStorage.setItem('auth_token', token)
      cachedUser = user
      setUser(user)
      setError(null)
      return { token, user }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    cachedUser = null
    cachedError = null
    setUser(null)
  }

  return { user, loading, error, login, logout }
}
