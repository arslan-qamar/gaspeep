import { apiClient } from '../lib/api'

export interface User {
  id: string
  email: string
  displayName: string
  tier: 'free' | 'premium'
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const authService = {
  async signup(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/signup', {
      email,
      password,
      displayName,
    })
    return data
  },

  async signin(email: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/signin', {
      email,
      password,
    })
    return data
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  logout(): void {
    localStorage.removeItem('auth_token')
  },
}
