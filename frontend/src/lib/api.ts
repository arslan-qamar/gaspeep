import axios from 'axios'

// Use relative URL so nginx proxy works when accessed over network
// If a VITE_API_URL is provided, ensure it ends with /api so callers
// using '/auth/...' become '/api/auth/...'. This prevents accidental
// requests to '/auth/me' when the env var is e.g. 'http://host:8080'.
const rawApiUrl = import.meta.env.VITE_API_URL || ''
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : rawApiUrl.replace(/\/+$/, '') + '/api')
  : '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Include credentials so cookie-based auth works across the app
  withCredentials: true,
})

// Handle response errors (redirect to signin on 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

// Station API
export interface Station {
  id: string
  name: string
  brand: string
  address: string
  latitude: number
  longitude: number
  operatingHours: string
  amenities: string[]
  lastVerifiedAt?: string
  createdAt: string
  updatedAt: string
}

export interface StationFilters {
  lat?: number
  lon?: number
  radius?: number
  fuelTypeId?: string
}

export const stationApi = {
  getStations: (filters?: StationFilters) => 
    apiClient.get<Station[]>('/stations', { params: filters }),
  
  getStation: (id: string) => 
    apiClient.get<Station>(`/stations/${id}`),
  
  createStation: (data: {
    name: string
    brand: string
    address: string
    latitude: number
    longitude: number
    operatingHours?: string
    amenities?: string[]
  }) => apiClient.post<Station>('/stations', data),
  
  updateStation: (id: string, data: Partial<Station>) => 
    apiClient.put<{ message: string }>(`/stations/${id}`, data),
  
  deleteStation: (id: string) => 
    apiClient.delete<{ message: string }>(`/stations/${id}`),
}

// Fuel Type API
export interface FuelType {
  id: string
  name: string
  displayName: string
  description: string
  colorCode: string
  displayOrder: number
}

export const fuelTypeApi = {
  getFuelTypes: () => 
    apiClient.get<FuelType[]>('/fuel-types'),
  
  getFuelType: (id: string) => 
    apiClient.get<FuelType>(`/fuel-types/${id}`),
}

export interface Brand {
  id: string
  name: string
  displayName: string
  displayOrder: number
}

export const brandApi = {
  getBrands: () =>
    apiClient.get<Brand[]>('/brands'),

  getBrand: (id: string) =>
    apiClient.get<Brand>(`/brands/${id}`),
}

// Fuel Price API
export interface FuelPrice {
  id: string
  stationId: string
  fuelTypeId: string
  price: number
  currency: string
  unit: string
  lastUpdatedAt?: string
  verificationStatus: string
  confirmationCount: number
  distanceKm?: number
  fuelType?: {
    name: string
    displayName: string
    colorCode: string
  }
  station?: {
    id: string
    name: string
    brand: string
    latitude: number
    longitude: number
  }
  fuelTypeName?: string
}

export interface FuelPriceFilters {
  stationId?: string
  fuelTypeId?: string
  lat?: number
  lon?: number
  radius?: number
  minPrice?: number
  maxPrice?: number
}

export const fuelPriceApi = {
  getFuelPrices: (filters?: FuelPriceFilters) => 
    apiClient.get<FuelPrice[]>('/fuel-prices', { params: filters }),
  
  getStationPrices: (stationId: string) => 
    apiClient.get<FuelPrice[]>(`/fuel-prices/station/${stationId}`),
  
  getCheapestPrices: (lat: number, lon: number, radius: number) => 
    apiClient.get<FuelPrice[]>('/fuel-prices/cheapest', {
      params: { lat, lon, radius }
    }),
}

export interface MapFilterPreferences {
  fuelTypes: string[]
  brands: string[]
  maxPrice: number
  onlyVerified: boolean
}

export const mapPreferencesApi = {
  getMapFilterPreferences: () =>
    apiClient.get<MapFilterPreferences>('/users/preferences/map-filters'),

  updateMapFilterPreferences: (preferences: MapFilterPreferences) =>
    apiClient.put<{ message: string }>('/users/preferences/map-filters', preferences),
}
