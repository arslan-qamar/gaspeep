/**
 * Type definitions for Map & Station Browsing section
 */

export interface Station {
  id: string
  name: string
  brand: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  operatingHours?: {
    open: string
    close?: string
  }
  amenities: string[]
  lastVerified: string
  distance?: number // Distance from user in miles
}

export interface FuelPrice {
  id: string
  stationId: string
  fuelType: FuelType
  price: number
  currency: string
  unit: string
  lastUpdated: string
  verificationConfidence: number
  submissionCount: number
  trend?: 'up' | 'down' | 'stable'
}

export type FuelType =
  | 'E10'
  | 'Unleaded 91'
  | 'Diesel'
  | 'Premium Diesel'
  | 'U95'
  | 'U98'
  | 'LPG'
  | 'Truck Diesel'
  | 'AdBlue'
  | 'E85'
  | 'Biodiesel'

export interface FuelTypeInfo {
  id: FuelType
  displayName: string
  description: string
  colorCode: string
  displayOrder: number
}

export interface FilterState {
  fuelTypes: FuelType[]
  priceRange: {
    min: number
    max: number
  } | null
}

export interface MapViewport {
  latitude: number
  longitude: number
  zoom: number
}

export interface StationWithPrices extends Station {
  prices: FuelPrice[]
  bestPrice?: FuelPrice
  lowestPriceForType?: (fuelType: FuelType) => FuelPrice | undefined
}

export interface MapMarker {
  stationId: string
  coordinates: {
    latitude: number
    longitude: number
  }
  priceIndicator: 'low' | 'medium' | 'high'
}

export interface SearchSuggestion {
  id: string
  type: 'address' | 'station' | 'city'
  displayText: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  stationId?: string
}

export interface AdContent {
  id: string
  type: 'banner' | 'video'
  imageUrl?: string
  videoUrl?: string
  duration: number // seconds
  ctaText?: string
  ctaUrl?: string
}
