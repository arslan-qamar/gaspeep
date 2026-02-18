import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as stationOwnerService from '../services/stationOwnerService'
import {
  StationOwner,
  ClaimedStation,
  Broadcast,
  DashboardStats,
  FuelType,
  FuelPrice,
  StationUpdateFormData,
  CreateBroadcastFormData,
} from '../sections/station-owner-dashboard/types'
import { AccountSettingsFormData } from '../sections/station-owner-dashboard/AccountSettingsScreen'

const DASHBOARD_KEY = ['station-owner', 'dashboard']

interface DashboardData {
  owner: StationOwner
  stations: ClaimedStation[]
  broadcasts: Broadcast[]
  stats: DashboardStats
  fuelTypes: FuelType[]
  currentFuelPrices: Record<string, FuelPrice[]>
}

export const useStationOwner = () => {
  const queryClient = useQueryClient()

  /**
   * Fetch complete dashboard data
   */
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<DashboardData, Error>({
    queryKey: DASHBOARD_KEY,
    queryFn: stationOwnerService.getDashboardData,
    staleTime: 60_000, // 1 minute
    retry: 1,
    refetchOnWindowFocus: false,
  })

  /**
   * Claim station mutation
   */
  const claimStationMutation = useMutation({
    mutationFn: (params: {
      stationId: string
      verificationMethod: 'document' | 'phone' | 'email'
      documentUrls?: string[]
      phoneNumber?: string
      email?: string
    }) =>
      stationOwnerService.claimStation(
        params.stationId,
        params.verificationMethod,
        params.documentUrls,
        params.phoneNumber,
        params.email
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Unclaim station mutation
   */
  const unclaimStationMutation = useMutation({
    mutationFn: (stationId: string) => stationOwnerService.unclaimStation(stationId),
    onMutate: async (stationId) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          stations: previousData.stations.filter((s) => s.id !== stationId),
        })
      }
      return { previousData }
    },
    onError: (_err, _stationId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Update station mutation
   */
  const updateStationMutation = useMutation({
    mutationFn: (params: { stationId: string; data: StationUpdateFormData }) =>
      stationOwnerService.updateClaimedStation(params.stationId, params.data),
    onMutate: async ({ stationId, data }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          stations: previousData.stations.map((s) => (s.id === stationId ? { ...s, ...data } : s)),
        })
      }
      return { previousData }
    },
    onError: (_err, _params, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Create broadcast mutation
   */
  const createBroadcastMutation = useMutation({
    mutationFn: (formData: CreateBroadcastFormData) => stationOwnerService.createBroadcast(formData),
    onSuccess: (newBroadcast) => {
      queryClient.setQueryData<DashboardData | undefined>(DASHBOARD_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          broadcasts: [newBroadcast, ...old.broadcasts],
        }
      })
    },
  })

  /**
   * Update broadcast mutation
   */
  const updateBroadcastMutation = useMutation({
    mutationFn: (params: { broadcastId: string; formData: Partial<CreateBroadcastFormData> }) =>
      stationOwnerService.updateBroadcast(params.broadcastId, params.formData),
    onMutate: async ({ broadcastId, formData }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          broadcasts: previousData.broadcasts.map((b) =>
            b.id === broadcastId ? { ...b, ...formData } : b
          ),
        })
      }
      return { previousData }
    },
    onError: (_err, _params, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Delete broadcast mutation
   */
  const deleteBroadcastMutation = useMutation({
    mutationFn: (broadcastId: string) => stationOwnerService.deleteBroadcast(broadcastId),
    onMutate: async (broadcastId) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          broadcasts: previousData.broadcasts.filter((b) => b.id !== broadcastId),
        })
      }
      return { previousData }
    },
    onError: (_err, _broadcastId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Send broadcast mutation
   */
  const sendBroadcastMutation = useMutation({
    mutationFn: (broadcastId: string) => stationOwnerService.sendBroadcast(broadcastId),
    onMutate: async (broadcastId) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          broadcasts: previousData.broadcasts.map((b) =>
            b.id === broadcastId ? { ...b, status: 'active' as const } : b
          ),
        })
      }
      return { previousData }
    },
    onError: (_err, _broadcastId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Schedule broadcast mutation
   */
  const scheduleBroadcastMutation = useMutation({
    mutationFn: (params: { broadcastId: string; scheduledFor: string }) =>
      stationOwnerService.scheduleBroadcast(params.broadcastId, params.scheduledFor),
    onMutate: async ({ broadcastId, scheduledFor }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          broadcasts: previousData.broadcasts.map((b) =>
            b.id === broadcastId ? { ...b, status: 'scheduled' as const, scheduledFor } : b
          ),
        })
      }
      return { previousData }
    },
    onError: (_err, _params, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Cancel broadcast mutation
   */
  const cancelBroadcastMutation = useMutation({
    mutationFn: (broadcastId: string) => stationOwnerService.cancelBroadcast(broadcastId),
    onMutate: async (broadcastId) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEY })
      const previousData = queryClient.getQueryData<DashboardData>(DASHBOARD_KEY)
      if (previousData) {
        queryClient.setQueryData<DashboardData>(DASHBOARD_KEY, {
          ...previousData,
          broadcasts: previousData.broadcasts.map((b) =>
            b.id === broadcastId ? { ...b, status: 'draft' as const } : b
          ),
        })
      }
      return { previousData }
    },
    onError: (_err, _broadcastId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(DASHBOARD_KEY, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  /**
   * Duplicate broadcast mutation
   */
  const duplicateBroadcastMutation = useMutation({
    mutationFn: (broadcastId: string) => stationOwnerService.duplicateBroadcast(broadcastId),
    onSuccess: (newBroadcast) => {
      queryClient.setQueryData<DashboardData | undefined>(DASHBOARD_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          broadcasts: [newBroadcast, ...old.broadcasts],
        }
      })
    },
  })

  /**
   * Update profile mutation
   */
  const updateProfileMutation = useMutation({
    mutationFn: (data: AccountSettingsFormData) =>
      stationOwnerService.updateStationOwnerProfile(data),
    onSuccess: (updatedOwner) => {
      queryClient.setQueryData<DashboardData | undefined>(DASHBOARD_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          owner: {
            ...old.owner,
            businessName: updatedOwner.businessName,
            contactName: updatedOwner.contactName,
            email: updatedOwner.email,
            phone: updatedOwner.phone,
          },
        }
      })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })

  return {
    // Data
    dashboardData: dashboardData || { owner: undefined, stations: [], broadcasts: [], stats: undefined, fuelTypes: [], currentFuelPrices: {} },
    owner: dashboardData?.owner,
    stations: dashboardData?.stations ?? [],
    broadcasts: dashboardData?.broadcasts ?? [],
    stats: dashboardData?.stats,
    fuelTypes: dashboardData?.fuelTypes ?? [],
    currentFuelPrices: dashboardData?.currentFuelPrices ?? {},

    // Loading and error states
    isLoading,
    isFetching,
    error: error ? (error as Error).message : null,
    refetch,

    // Mutations
    claimStation: claimStationMutation.mutateAsync,
    unclaimStation: unclaimStationMutation.mutateAsync,
    updateStation: updateStationMutation.mutateAsync,
    createBroadcast: createBroadcastMutation.mutateAsync,
    updateBroadcast: updateBroadcastMutation.mutateAsync,
    deleteBroadcast: deleteBroadcastMutation.mutateAsync,
    sendBroadcast: sendBroadcastMutation.mutateAsync,
    scheduleBroadcast: scheduleBroadcastMutation.mutateAsync,
    cancelBroadcast: cancelBroadcastMutation.mutateAsync,
    duplicateBroadcast: duplicateBroadcastMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,

    // Mutation states
    isClaimingStation: claimStationMutation.isPending,
    isUnclaimingStation: unclaimStationMutation.isPending,
    isUpdatingStation: updateStationMutation.isPending,
    isCreatingBroadcast: createBroadcastMutation.isPending,
    isUpdatingBroadcast: updateBroadcastMutation.isPending,
    isDeletingBroadcast: deleteBroadcastMutation.isPending,
    isSendingBroadcast: sendBroadcastMutation.isPending,
    isSchedulingBroadcast: scheduleBroadcastMutation.isPending,
    isCancelingBroadcast: cancelBroadcastMutation.isPending,
    isDuplicatingBroadcast: duplicateBroadcastMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,

    // Mutation errors
    claimStationError: claimStationMutation.error,
    unclaimStationError: unclaimStationMutation.error,
    updateStationError: updateStationMutation.error,
    createBroadcastError: createBroadcastMutation.error,
    updateBroadcastError: updateBroadcastMutation.error,
    deleteBroadcastError: deleteBroadcastMutation.error,
    sendBroadcastError: sendBroadcastMutation.error,
    scheduleBroadcastError: scheduleBroadcastMutation.error,
    cancelBroadcastError: cancelBroadcastMutation.error,
    duplicateBroadcastError: duplicateBroadcastMutation.error,
    updateProfileError: updateProfileMutation.error,
  }
}
