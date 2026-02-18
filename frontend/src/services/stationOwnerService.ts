import { apiClient } from '../lib/api'
import {
  StationOwner,
  ClaimedStation,
  Broadcast,
  DashboardStats,
  FuelType,
  AvailableStation,
  VerificationRequest,
  CreateBroadcastFormData,
  StationUpdateFormData,
  FuelPrice,
  BroadcastEngagementMetric,
} from '../sections/station-owner-dashboard/types'
import { AccountSettingsFormData } from '../sections/station-owner-dashboard/AccountSettingsScreen'

/**
 * Station Owner Dashboard API Service
 * Handles all API calls for station owner features including verification,
 * station management, and broadcast creation/management.
 */

// ============================================================================
// DASHBOARD & STATISTICS
// ============================================================================

/**
 * Get complete dashboard data for a station owner
 */
export const getDashboardData = async (): Promise<{
  owner: StationOwner
  stations: ClaimedStation[]
  broadcasts: Broadcast[]
  stats: DashboardStats
  fuelTypes: FuelType[]
  currentFuelPrices: Record<string, FuelPrice[]>
}> => {
  try {
    // Fetch all data in parallel
    const [ownerRes, stationsRes, broadcastsRes, statsRes, fuelTypesRes, pricesRes] = await Promise.all([
      apiClient.get('/station-owners/profile'),
      apiClient.get('/station-owners/stations'),
      apiClient.get('/broadcasts'),
      apiClient.get('/station-owners/stats'),
      apiClient.get('/fuel-types'),
      apiClient.get('/station-owners/fuel-prices'),
    ])

    return {
      owner: ownerRes.data,
      stations: stationsRes.data || [],
      broadcasts: broadcastsRes.data || [],
      stats: statsRes.data,
      fuelTypes: fuelTypesRes.data || [],
      currentFuelPrices: pricesRes.data || {},
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    throw error
  }
}

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get('/station-owners/stats')
  return data
}

// ============================================================================
// STATION OWNER VERIFICATION & PROFILE
// ============================================================================

/**
 * Get current station owner profile
 */
export const getStationOwnerProfile = async (): Promise<StationOwner> => {
  const { data } = await apiClient.get('/station-owners/profile')
  return data
}

/**
 * Update station owner profile (account settings)
 */
export const updateStationOwnerProfile = async (
  data: AccountSettingsFormData
): Promise<StationOwner> => {
  const { data: responseData } = await apiClient.patch('/station-owners/profile', {
    businessName: data.businessName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
  })
  return responseData
}

/**
 * Submit verification for station ownership
 */
export const submitVerification = async (
  businessName: string,
  contactName: string,
  email: string,
  phone: string,
  verificationMethod: 'document' | 'phone' | 'email',
  documentUrls?: string[],
  verificationCode?: string
): Promise<VerificationRequest> => {
  const { data } = await apiClient.post('/station-owners/verify', {
    businessName,
    contactName,
    email,
    phone,
    verificationMethod,
    documentUrls,
    verificationCode,
  })
  return data
}

/**
 * Re-verify station ownership (annual requirement)
 */
export const reVerifyStation = async (stationId: string): Promise<VerificationRequest> => {
  const { data } = await apiClient.post(`/station-owners/stations/${stationId}/reverify`, {})
  return data
}

// ============================================================================
// CLAIMED STATIONS
// ============================================================================

/**
 * Get all claimed stations for current owner
 */
export const getClaimedStations = async (): Promise<ClaimedStation[]> => {
  const { data } = await apiClient.get('/station-owners/stations')
  return data || []
}

/**
 * Get single claimed station details
 */
export const getClaimedStation = async (stationId: string): Promise<ClaimedStation> => {
  const { data } = await apiClient.get(`/station-owners/stations/${stationId}`)
  return data
}

/**
 * Search for available stations to claim
 */
export const searchAvailableStations = async (
  query: string,
  lat?: number,
  lon?: number,
  radius?: number
): Promise<AvailableStation[]> => {
  const { data } = await apiClient.get('/station-owners/search-stations', {
    params: { query, lat, lon, radius },
  })
  return data || []
}

/**
 * Claim a station
 */
export const claimStation = async (
  stationId: string,
  verificationMethod: 'document' | 'phone' | 'email',
  documentUrls?: string[],
  phoneNumber?: string,
  email?: string
): Promise<VerificationRequest> => {
  const { data } = await apiClient.post('/station-owners/claim-station', {
    stationId,
    verificationMethod,
    documentUrls,
    phoneNumber,
    email,
  })
  return data
}

/**
 * Update claimed station information
 */
export const updateClaimedStation = async (
  stationId: string,
  stationData: StationUpdateFormData
): Promise<ClaimedStation> => {
  const { data } = await apiClient.put(`/station-owners/stations/${stationId}`, stationData)
  return data
}

/**
 * Upload station photos
 */
export const uploadStationPhotos = async (
  stationId: string,
  files: File[]
): Promise<{ photos: string[] }> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('photos', file)
  })

  const { data } = await apiClient.post(
    `/station-owners/stations/${stationId}/photos`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return data
}

/**
 * Unclaim a station
 */
export const unclaimStation = async (stationId: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post(
    `/station-owners/stations/${stationId}/unclaim`,
    {}
  )
  return data
}

// ============================================================================
// BROADCASTS
// ============================================================================

/**
 * Get all broadcasts for current owner
 */
export const getBroadcasts = async (): Promise<Broadcast[]> => {
  const { data } = await apiClient.get('/broadcasts')
  return data || []
}

/**
 * Get single broadcast details
 */
export const getBroadcast = async (broadcastId: string): Promise<Broadcast> => {
  const { data } = await apiClient.get(`/broadcasts/${broadcastId}`)
  return data
}

/**
 * Get broadcast engagement metrics/analytics
 */
export const getBroadcastEngagement = async (
  broadcastId: string
): Promise<BroadcastEngagementMetric[]> => {
  const { data } = await apiClient.get(`/broadcasts/${broadcastId}/engagement`)
  return data || []
}

/**
 * Create new broadcast
 */
export const createBroadcast = async (
  formData: CreateBroadcastFormData
): Promise<Broadcast> => {
  const { data } = await apiClient.post('/broadcasts', {
    stationId: formData.stationId,
    title: formData.title,
    message: formData.message,
    promotionType: formData.promotionType,
    fuelTypes: formData.fuelTypes,
    targetRadius: formData.targetRadius,
    scheduledFor: formData.scheduledFor,
    expiresAt: formData.expiresAt,
  })
  return data
}

/**
 * Update existing broadcast (for drafts and scheduled)
 */
export const updateBroadcast = async (
  broadcastId: string,
  formData: Partial<CreateBroadcastFormData>
): Promise<Broadcast> => {
  const { data } = await apiClient.put(`/broadcasts/${broadcastId}`, formData)
  return data
}

/**
 * Save broadcast as draft
 */
export const saveBroadcastDraft = async (
  formData: CreateBroadcastFormData
): Promise<Broadcast> => {
  const { data } = await apiClient.post('/broadcasts/draft', {
    ...formData,
    status: 'draft',
  })
  return data
}

/**
 * Send/publish a broadcast
 */
export const sendBroadcast = async (broadcastId: string): Promise<Broadcast> => {
  const { data } = await apiClient.post(`/broadcasts/${broadcastId}/send`, {})
  return data
}

/**
 * Schedule a broadcast for later
 */
export const scheduleBroadcast = async (
  broadcastId: string,
  scheduledFor: string
): Promise<Broadcast> => {
  const { data } = await apiClient.post(`/broadcasts/${broadcastId}/schedule`, {
    scheduledFor,
  })
  return data
}

/**
 * Cancel scheduled broadcast
 */
export const cancelBroadcast = async (broadcastId: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post(`/broadcasts/${broadcastId}/cancel`, {})
  return data
}

/**
 * Delete broadcast (only for drafts and scheduled)
 */
export const deleteBroadcast = async (broadcastId: string): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(`/broadcasts/${broadcastId}`)
  return data
}

/**
 * Duplicate a broadcast
 */
export const duplicateBroadcast = async (
  broadcastId: string
): Promise<Broadcast> => {
  const { data } = await apiClient.post(`/broadcasts/${broadcastId}/duplicate`, {})
  return data
}

/**
 * Get estimated recipient count for broadcast radius
 */
export const getEstimatedRecipients = async (
  stationId: string,
  radiusKm: number
): Promise<{ estimatedCount: number }> => {
  const { data } = await apiClient.get(
    `/broadcasts/estimate-recipients`,
    {
      params: { stationId, radiusKm },
    }
  )
  return data
}

// ============================================================================
// FUEL TYPES & PRICES
// ============================================================================

/**
 * Get all fuel types
 */
export const getFuelTypes = async (): Promise<FuelType[]> => {
  const { data } = await apiClient.get('/fuel-types')
  return data || []
}

/**
 * Get current fuel prices for a station
 */
export const getStationFuelPrices = async (stationId: string): Promise<FuelPrice[]> => {
  const { data } = await apiClient.get(`/fuel-prices/station/${stationId}`)
  return data || []
}

/**
 * Get fuel prices for all owner's stations
 */
export const getOwnerFuelPrices = async (): Promise<Record<string, FuelPrice[]>> => {
  const { data } = await apiClient.get('/station-owners/fuel-prices')
  return data || {}
}

// ============================================================================
// COMBINED SERVICE OBJECT
// ============================================================================

export const stationOwnerService = {
  // Dashboard
  getDashboardData,
  getDashboardStats,

  // Owner Profile
  getStationOwnerProfile,
  updateStationOwnerProfile,
  submitVerification,
  reVerifyStation,

  // Claimed Stations
  getClaimedStations,
  getClaimedStation,
  searchAvailableStations,
  claimStation,
  updateClaimedStation,
  uploadStationPhotos,
  unclaimStation,

  // Broadcasts
  getBroadcasts,
  getBroadcast,
  getBroadcastEngagement,
  createBroadcast,
  updateBroadcast,
  saveBroadcastDraft,
  sendBroadcast,
  scheduleBroadcast,
  cancelBroadcast,
  deleteBroadcast,
  duplicateBroadcast,
  getEstimatedRecipients,

  // Fuel Types & Prices
  getFuelTypes,
  getStationFuelPrices,
  getOwnerFuelPrices,
}
