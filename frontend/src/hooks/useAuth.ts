import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, authService } from '../services/authService'

const CURRENT_USER_KEY = ['auth', 'currentUser']

export const useAuth = () => {
  const queryClient = useQueryClient()

  const fetchCurrentUser = async (): Promise<User | null> => {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    return await authService.getCurrentUser()
  }

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    // Only try to fetch if we have a token
    enabled: !!localStorage.getItem('auth_token'),
    // Note: keepPreviousData/onError removed for v5 types; handle error side-effects below
  })

  // Clear token on query error to avoid stuck auth state
  if (error) {
    try {
      localStorage.removeItem('auth_token')
    } catch (e) {
      /* ignore */
    }
  }

  const signinMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.signin(email, password)
    },
    onSuccess: (data) => {
      const { token, user } = data
      localStorage.setItem('auth_token', token)
      queryClient.setQueryData(CURRENT_USER_KEY, user)
    },
  })

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await signinMutation.mutateAsync({ email, password })
      return result
    },
    [signinMutation]
  )

  const logout = useCallback(() => {
    authService.logout()
    localStorage.removeItem('auth_token')
    queryClient.setQueryData(CURRENT_USER_KEY, null)
    queryClient.clear()
  }, [queryClient])

  return {
    user: user ?? null,
    loading: isLoading || signinMutation.isPending,
    error: error ? String(error.message) : signinMutation.error ? String((signinMutation.error as Error).message) : null,
    login,
    logout,
    // expose mutation state for callers that need it
    _mutations: { signin: signinMutation },
  }
}
