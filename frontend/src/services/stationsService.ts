import { apiClient } from '@/lib/api'

// intentionally no local utils required

export type NearbyParams = {
  latitude: number
  longitude: number
  radiusKm: number
  fuelTypes?: Array<number | string>
  maxPrice?: number
}


export async function fetchNearbyStations(params: NearbyParams, signal?: AbortSignal) {
  try {
    const config: Record<string, any> = {}
    if (signal) config.signal = signal
    const resp = await apiClient.post('/stations/nearby', params, config)
    return resp.data
  } catch (e) {
    throw new Error('Failed to fetch nearby stations')
  }
}

export async function searchStations(q: string, _location: { lat: number; lng: number }, _zoom: number, filters: any, signal?: AbortSignal) {
  try {
    const config: Record<string, any> = { params: { q } }
    if (signal) config.signal = signal
    const resp = await apiClient.get('/stations/search', config)
    const results = resp.data

  // Apply simple client-side filtering similar to previous implementation
  const matchesFuelType = (station: any) => {
    if (!filters?.fuelTypes || filters.fuelTypes.length === 0) return true
    return (station.prices || []).some((p: any) => {
      const id = p.fuelTypeId ?? p.fuel_type_id ?? p.fuel_type ?? p.fuelType
      return id != null && filters.fuelTypes.includes(id)
    })
  }

  const matchesMaxPrice = (station: any) => {
    if (!filters?.maxPrice || filters.maxPrice <= 0) return true
    return (station.prices || []).some((p: any) => {
      const price = p.price ?? p.amount
      return typeof price === 'number' && price <= filters.maxPrice
    })
  }

    return (results as any[])
    .map((station) => ({ station, distance: 0 /* caller will recalc */ }))
    .filter((item) => matchesFuelType(item.station) && matchesMaxPrice(item.station))
    .map((item) => item.station)
  } catch (e) {
    throw new Error('Failed to search stations')
  }
}
