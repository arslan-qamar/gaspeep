import axios from 'axios'

// Use relative URL so nginx proxy works when accessed over network
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add authorization token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
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
