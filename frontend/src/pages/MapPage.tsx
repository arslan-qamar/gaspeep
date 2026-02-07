import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle } from 'lucide-react'
import { Map } from '../components/Map'
import { MapFilters } from '../components/MapFilters'
import { StationDetail } from '../components/StationDetail'
import {
  stationApi,
  fuelTypeApi,
  fuelPriceApi,
  type Station,
  type FuelType,
  type FuelPrice,
} from '../lib/api'

export function MapPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [prices, setPrices] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [selectedStationPrices, setSelectedStationPrices] = useState<
    FuelPrice[]
  >([])

  // Filter state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )
  const [selectedFuelType, setSelectedFuelType] = useState<string | undefined>()
  const [minPrice, setMinPrice] = useState<number | undefined>()
  const [maxPrice, setMaxPrice] = useState<number | undefined>()
  const [radius, setRadius] = useState<number>(10)

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ])
        },
        (error) => {
          console.warn('Geolocation not available:', error.message)
          // Default to Sydney if location is denied or unavailable (e.g., non-HTTPS)
          setUserLocation([-33.8688, 151.2093])
        }
      )
    } else {
      // Default to Sydney if geolocation is not supported
      setUserLocation([-33.8688, 151.2093])
    }
  }, [])

  // Load fuel types on mount
  useEffect(() => {
    const loadFuelTypes = async () => {
      try {
        const response = await fuelTypeApi.getFuelTypes()
        setFuelTypes(response.data)
      } catch (err) {
        console.error('Failed to load fuel types:', err)
        setError('Failed to load fuel types')
      }
    }

    loadFuelTypes()
  }, [])

  // Load stations and prices when location or filters change
  useEffect(() => {
    if (!userLocation) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [lat, lon] = userLocation

        // Fetch stations with filters
        const stationsResponse = await stationApi.getStations({
          lat,
          lon,
          radius,
          fuelTypeId: selectedFuelType,
        })
        setStations(stationsResponse.data)

        // Fetch prices with filters
        const pricesResponse = await fuelPriceApi.getFuelPrices({
          lat,
          lon,
          radius,
          fuelTypeId: selectedFuelType,
          minPrice,
          maxPrice,
        })
        setPrices(pricesResponse.data)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load stations and prices')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userLocation, radius, selectedFuelType, minPrice, maxPrice])

  // Load station prices when a station is selected
  useEffect(() => {
    if (!selectedStation) {
      setSelectedStationPrices([])
      return
    }

    const loadStationPrices = async () => {
      try {
        const response = await fuelPriceApi.getStationPrices(
          selectedStation.id
        )
        setSelectedStationPrices(response.data)
      } catch (err) {
        console.error('Failed to load station prices:', err)
      }
    }

    loadStationPrices()
  }, [selectedStation])

  const handleStationClick = (station: Station) => {
    setSelectedStation(station)
  }

  const handlePriceRangeChange = (min?: number, max?: number) => {
    setMinPrice(min)
    setMaxPrice(max)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Gas Peep</h1>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          {fuelTypes.length > 0 && (
            <MapFilters
              fuelTypes={fuelTypes}
              selectedFuelType={selectedFuelType}
              minPrice={minPrice}
              maxPrice={maxPrice}
              radius={radius}
              onFuelTypeChange={setSelectedFuelType}
              onPriceRangeChange={handlePriceRangeChange}
              onRadiusChange={setRadius}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {loading && !stations.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {userLocation && (
          <Map
            stations={stations}
            prices={prices}
            center={userLocation}
            zoom={12}
            onStationClick={handleStationClick}
            selectedStationId={selectedStation?.id}
          />
        )}

        {/* Station Count Badge */}
        {stations.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {stations.length}
              </span>{' '}
              station{stations.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}
      </main>

      {/* Station Detail Modal */}
      {selectedStation && (
        <StationDetail
          station={selectedStation}
          prices={selectedStationPrices}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  )
}
