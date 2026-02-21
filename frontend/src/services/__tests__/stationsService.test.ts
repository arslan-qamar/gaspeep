import {
  fetchNearbyStations,
  searchStations,
  searchStationsNearby,
  type NearbyParams,
  type SearchNearbyParams,
} from '../stationsService'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

describe('stationsService', () => {
  beforeEach(() => {
    ;(apiClient.post as jest.Mock).mockReset()
    ;(apiClient.get as jest.Mock).mockReset()
  })

  it('fetchNearbyStations posts payload and returns response data', async () => {
    const params: NearbyParams = {
      latitude: -33.8,
      longitude: 151.2,
      radiusKm: 10,
      fuelTypes: [1, '2'],
      maxPrice: 1.95,
    }
    const signal = new AbortController().signal
    const responseData = [{ id: 'station-1' }]
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: responseData })

    const result = await fetchNearbyStations(params, signal)

    expect(apiClient.post).toHaveBeenCalledWith('/stations/nearby', params, { signal })
    expect(result).toEqual(responseData)
  })

  it('fetchNearbyStations throws normalized error message on failure', async () => {
    ;(apiClient.post as jest.Mock).mockRejectedValue(new Error('network down'))

    await expect(
      fetchNearbyStations({ latitude: 1, longitude: 2, radiusKm: 5 })
    ).rejects.toThrow('Failed to fetch nearby stations')
  })

  it('searchStations returns all stations when no filters are active', async () => {
    const stations = [
      { id: 's1', prices: [{ fuelTypeId: 1, price: 1.5 }] },
      { id: 's2', prices: [{ fuelType: 'diesel', amount: 2.2 }] },
    ]
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: stations })

    const result = await searchStations(
      'city',
      { lat: -33.8, lng: 151.2 },
      10,
      {},
      undefined
    )

    expect(apiClient.get).toHaveBeenCalledWith('/stations/search', { params: { q: 'city' } })
    expect(result).toEqual(stations)
  })

  it('searchStations filters by fuel type and max price', async () => {
    const stations = [
      {
        id: 's1',
        prices: [
          { fuelTypeId: 1, price: 1.8 },
          { fuel_type_id: 'diesel', amount: 2.3 },
        ],
      },
      {
        id: 's2',
        prices: [{ fuel_type: 'diesel', price: 2.0 }],
      },
      {
        id: 's3',
        prices: [{ fuelType: 1, amount: 2.2 }],
      },
    ]
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: stations })

    const result = await searchStations(
      'station',
      { lat: 0, lng: 0 },
      8,
      { fuelTypes: [1, 'diesel'], maxPrice: 2.05 }
    )

    expect(result).toEqual([
      { id: 's1', prices: [{ fuelTypeId: 1, price: 1.8 }, { fuel_type_id: 'diesel', amount: 2.3 }] },
      { id: 's2', prices: [{ fuel_type: 'diesel', price: 2.0 }] },
    ])
  })

  it('searchStations throws normalized error message on failure', async () => {
    ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('timeout'))

    await expect(
      searchStations('q', { lat: 0, lng: 0 }, 10, { fuelTypes: [1], maxPrice: 2 })
    ).rejects.toThrow('Failed to search stations')
  })

  it('searchStationsNearby posts payload and returns response data', async () => {
    const params: SearchNearbyParams = {
      latitude: -33.8,
      longitude: 151.2,
      radiusKm: 12,
      query: 'Fuel',
      fuelTypes: [1],
      maxPrice: 2.1,
    }
    const signal = new AbortController().signal
    const responseData = { stations: [{ id: 's1' }] }
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: responseData })

    const result = await searchStationsNearby(params, signal)

    expect(apiClient.post).toHaveBeenCalledWith('/stations/search-nearby', params, { signal })
    expect(result).toEqual(responseData)
  })

  it('searchStationsNearby throws normalized error message on failure', async () => {
    ;(apiClient.post as jest.Mock).mockRejectedValue(new Error('bad gateway'))

    await expect(
      searchStationsNearby({ latitude: 1, longitude: 2, radiusKm: 3, query: 'x' })
    ).rejects.toThrow('Failed to search nearby stations')
  })
})
