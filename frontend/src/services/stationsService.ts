import { getRadiusFromZoom } from '../lib/utils'

export type NearbyParams = {
  latitude: number
  longitude: number
  radiusKm: number
  fuelTypes?: number[]
  maxPrice?: number
}

export async function fetchNearbyStations(params: NearbyParams, signal?: AbortSignal) {
  const response = await fetch('/api/stations/nearby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  })

  if (!response.ok) throw new Error('Failed to fetch nearby stations')
  return response.json()
}

export async function searchStations(q: string, location: { lat: number; lng: number }, zoom: number, filters: any, signal?: AbortSignal) {
  const response = await fetch(`/api/stations/search?q=${encodeURIComponent(q)}`, { signal })
  if (!response.ok) throw new Error('Failed to search stations')

  const results = await response.json()

  // Apply simple client-side filtering similar to previous implementation
  const radius = getRadiusFromZoom(zoom)

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
}
