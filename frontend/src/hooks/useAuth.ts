import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, authService } from '../services/authService'

const CURRENT_USER_KEY = ['auth', 'currentUser']

export const useAuth = () => {
  const queryClient = useQueryClient()

  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      return await authService.getCurrentUser()
    } catch (err) {
      return null
    }
  }

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    // Try fetching current user on app load (supports cookie-based sessions)
    enabled: true,
    // Note: keepPreviousData/onError removed for v5 types; handle error side-effects below
  })

  // Clear query cache on error to avoid stuck auth state
  if (error) {
    queryClient.setQueryData(CURRENT_USER_KEY, null)
  }

  const signinMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.signin(email, password)
    },
    onSuccess: (data) => {
      const { user } = data
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
