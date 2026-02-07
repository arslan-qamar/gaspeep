import { useEffect, useState } from 'react'
import { User, authService } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      authService
        .getCurrentUser()
        .then(setUser)
        .catch((err) => {
          setError(err.message)
          localStorage.removeItem('auth_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { token, user } = await authService.signin(email, password)
      localStorage.setItem('auth_token', token)
      setUser(user)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return { user, loading, error, login, logout }
}
