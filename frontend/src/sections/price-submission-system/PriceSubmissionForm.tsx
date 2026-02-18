import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient, stationApi } from '../../lib/api'
import { VoiceInputScreen } from './VoiceInputScreen'
import { PhotoUploadScreen } from './PhotoUploadScreen'
import { searchStationsNearby } from '../../services/stationsService'
import { calculateDistance } from '../../lib/utils'
import { MapView } from '../map-and-station-browsing/components/MapView'
import type { Station as MapStation } from '../map-and-station-browsing/types'

export type Station = {
  id: string
  name: string
  address?: string
  brand?: string
  distance?: number
  latitude?: number
  longitude?: number
}

export type FuelType = { id: string; name: string; displayName?: string }

type SubmissionStep = 'station' | 'submit' | 'confirm'

export const PriceSubmissionForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('station')
  const [station, setStation] = useState<Station | null>(null)
  const [fuelType, setFuelType] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [method, setMethod] = useState<'text' | 'voice' | 'photo'>('text')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<any>(null)

  const [fuelTypesList, setFuelTypesList] = useState<FuelType[]>([])

  const [stationQuery, setStationQuery] = useState('')
  const [nearbyStations, setNearbyStations] = useState<Station[]>([])
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapViewport, setMapViewport] = useState<{ latitude: number; longitude: number; zoom: number } | null>(null)
  const [lastFetchPoint, setLastFetchPoint] = useState<{ lat: number; lng: number } | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const isMountedRef = useRef(true)

  const steps = [
    { number: 1, label: 'Select Station' },
    { number: 2, label: 'Submit Price' },
    { number: 3, label: 'Confirmation' },
  ]

  const currentStepNumber =
    currentStep === 'station' ? 1 : currentStep === 'submit' ? 2 : 3

  // Prefill station / fuel type from navigation state (e.g. from map)
  useEffect(() => {
    const state = (location.state || {}) as any

    if (state?.fuelTypeId) {
      setFuelType(state.fuelTypeId)
    }

    if (state?.stationId) {
      ;(async () => {
        try {
          const resp = await stationApi.getStation(state.stationId)
          const data = resp.data
          if (!isMountedRef.current) return
          setStation({
            id: data.id,
            name: data.name,
            address: data.address,
            brand: (data as any).brand,
            latitude: data.latitude,
            longitude: data.longitude,
          })
        } catch (_err) {
          // ignore prefill failures
        }
      })()
    }
  }, [location.state])

  // Load fuel types on mount
  useEffect(() => {
    isMountedRef.current = true

    ;(async () => {
      try {
        const resp = await apiClient.get('/fuel-types')
        if (!isMountedRef.current) return
        setFuelTypesList(resp.data || [])
        if (!fuelType && resp.data && resp.data.length > 0) {
          setFuelType(resp.data[0].id)
        }
      } catch (_err) {
        // ignore
      }
    })()

    return () => {
      isMountedRef.current = false
    }
  }, [fuelType])

  // Geolocation for station step
  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: 40.7128, lng: -74.006 }
      setUserLocation(fallback)
      setMapViewport({
        latitude: fallback.lat,
        longitude: fallback.lng,
        zoom: 12,
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(nextLocation)
        setMapViewport({
          latitude: nextLocation.lat,
          longitude: nextLocation.lng,
          zoom: 14,
        })
      },
      () => {
        // fallback to NYC if denied
        const fallback = { lat: 40.7128, lng: -74.006 }
        setUserLocation(fallback)
        setMapViewport({
          latitude: fallback.lat,
          longitude: fallback.lng,
          zoom: 12,
        })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const fetchNearby = useCallback(async (lat: number, lng: number, zoom: number) => {
    setIsLoadingStations(true)
    try {
      const radiusKm = zoom >= 15 ? 3 : zoom >= 12 ? 8 : 15
      const response = await searchStationsNearby({ latitude: lat, longitude: lng, radiusKm })

      const mapped: Station[] = (response || [])
        .filter((s: any) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          brand: s.brand,
          latitude: s.latitude,
          longitude: s.longitude,
          distance: calculateDistance(lat, lng, s.latitude, s.longitude),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))

      if (!isMountedRef.current) return
      setNearbyStations(mapped)
      setLastFetchPoint({ lat, lng })
    } catch (_err) {
      if (!isMountedRef.current) return
      setNearbyStations([])
    } finally {
      if (!isMountedRef.current) return
      setIsLoadingStations(false)
    }
  }, [])

  useEffect(() => {
    if (!mapViewport) return

    const shouldFetch =
      !lastFetchPoint ||
      calculateDistance(lastFetchPoint.lat, lastFetchPoint.lng, mapViewport.latitude, mapViewport.longitude) > 1

    if (!shouldFetch) return

    fetchNearby(mapViewport.latitude, mapViewport.longitude, mapViewport.zoom)
  }, [mapViewport, lastFetchPoint, fetchNearby])

  const filteredStations = useMemo(() => {
    if (!stationQuery.trim()) return nearbyStations
    const query = stationQuery.toLowerCase()
    return nearbyStations.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.address || '').toLowerCase().includes(query) ||
        (s.brand || '').toLowerCase().includes(query)
    )
  }, [nearbyStations, stationQuery])

  const mapStations = useMemo<MapStation[]>(() => {
    return filteredStations
      .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map((s) => ({
        id: s.id,
        name: s.name,
        brand: s.brand,
        address: s.address || '',
        latitude: s.latitude as number,
        longitude: s.longitude as number,
        prices: [],
      }))
  }, [filteredStations])

  const parsedPrice = useMemo(() => parseFloat(price || ''), [price])

  const resolveFuelTypeId = useCallback(
    (input: string) => {
      const exactId = fuelTypesList.find((f) => f.id === input)
      if (exactId) return exactId.id

      const normalized = input.trim().toLowerCase()
      const byName = fuelTypesList.find(
        (f) =>
          f.name.toLowerCase() === normalized ||
          (f.displayName || '').toLowerCase() === normalized
      )
      return byName?.id || fuelType || ''
    },
    [fuelType, fuelTypesList]
  )

  async function submit() {
    setError(null)
    if (!station) return setError('Please select a station')
    if (!fuelType) return setError('Please select a fuel type')
    if (isNaN(parsedPrice)) return setError('Price must be a number')
    if (parsedPrice <= 0) return setError('Price must be positive')
    if (parsedPrice > 100) {
      if (!confirm('The price entered looks unusually high. Submit anyway?')) return
    }

    setLoading(true)
    try {
      const { data } = await apiClient.post('/price-submissions', {
        stationId: station.id,
        fuelTypeId: fuelType,
        price: parsedPrice,
        submissionMethod: method,
      })

      const fuelDisplay = (fuelTypesList || []).find((f: any) => f.id === fuelType)
      const enhanced = Object.assign({}, data, {
        station_name: station?.name || data.station_name || data.stationName,
        fuel_type:
          (fuelDisplay && (fuelDisplay.displayName || fuelDisplay.name)) ||
          data.fuel_type ||
          data.fuelTypeName,
      })

      try {
        const key = 'price_submission_history'
        const existingRaw = localStorage.getItem(key)
        const existing = existingRaw ? JSON.parse(existingRaw) : []
        const record = {
          id: enhanced.id || `local-${Date.now()}`,
          station_name: enhanced.station_name,
          fuel_type: enhanced.fuel_type,
          price: enhanced.price,
          submittedAt: enhanced.submittedAt || new Date().toISOString(),
          moderationStatus: enhanced.moderationStatus || enhanced.status || 'pending',
        }
        const next = [record].concat(existing).slice(0, 50)
        localStorage.setItem(key, JSON.stringify(next))
      } catch (_err) {
        // ignore localStorage errors
      }

      setConfirmed(enhanced)
      setCurrentStep('confirm')
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Submit Fuel Price</h1>
          <p className="text-slate-600 dark:text-slate-400">Step {currentStepNumber} of 3: {steps[currentStepNumber - 1].label}</p>
        </div>

        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step.number <= currentStepNumber
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label={`Step ${step.number}: ${step.label}`}
            />
          ))}
        </div>

        {currentStep === 'station' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Select Nearby Station</h2>

            <input
              type="text"
              value={stationQuery}
              onChange={(e) => setStationQuery(e.target.value)}
              placeholder="Search nearby stations"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />

            <div className="h-80 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
              {userLocation && mapViewport ? (
                <MapView
                  stations={mapStations}
                  selectedStationId={station?.id}
                  onStationSelect={(selected) => {
                    const chosen = filteredStations.find((s) => s.id === selected.id)
                    if (chosen) setStation(chosen)
                  }}
                  userLocation={userLocation}
                  onViewportChange={setMapViewport}
                  isFetchingMore={isLoadingStations}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
                  Locating nearby stations...
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {isLoadingStations && filteredStations.length === 0 ? (
                <div className="p-4 text-center text-slate-600 dark:text-slate-400">Loading nearby stations...</div>
              ) : filteredStations.length === 0 ? (
                <div className="p-4 text-center text-slate-600 dark:text-slate-400">No nearby stations found.</div>
              ) : (
                filteredStations.slice(0, 20).map((s) => {
                  const isSelected = s.id === station?.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStation(s)}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{s.address || 'Address unavailable'}</div>
                      {typeof s.distance === 'number' && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{s.distance.toFixed(1)} km away</div>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep('submit')}
              disabled={!station}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                station
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue to Price Entry
            </button>
          </div>
        )}

        {currentStep === 'submit' && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Enter Price Details</h2>
                {station && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {station.name} {station.address ? `• ${station.address}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMethod('voice')
                    setShowModal(true)
                  }}
                  title="Voice Entry"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span className="text-lg">🎤</span>
                </button>
                <button
                  onClick={() => {
                    setMethod('photo')
                    setShowModal(true)
                  }}
                  title="Camera / Photo Entry"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span className="text-lg">📸</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Fuel Type *</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fuelTypesList.length === 0 ? (
                  <option value="">Loading...</option>
                ) : (
                  fuelTypesList.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.displayName || f.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Price (per litre) *</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">$</span>
                <input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="3.79"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <span className="text-slate-600 dark:text-slate-400">/L</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentStep('station')}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-900 dark:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={loading || !station || !fuelType || isNaN(parsedPrice) || parsedPrice <= 0}
                className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                  loading || !station || !fuelType || isNaN(parsedPrice) || parsedPrice <= 0
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Price'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {method === 'voice' ? 'Voice Entry' : 'Camera / Photo Entry'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setMethod('text')
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="p-6">
              {method === 'voice' && (
                <VoiceInputScreen
                  onParsed={(data) => {
                    setFuelType(resolveFuelTypeId(data.fuelType))
                    setPrice(String(data.price))
                    setMethod('text')
                    setShowModal(false)
                  }}
                  onCancel={() => {
                    setShowModal(false)
                    setMethod('text')
                  }}
                  isModal={true}
                />
              )}

              {method === 'photo' && (
                <PhotoUploadScreen
                  onParsed={(data) => {
                    setFuelType(resolveFuelTypeId(data.fuelType))
                    setPrice(String(data.price))
                    setMethod('text')
                    setShowModal(false)
                  }}
                  onCancel={() => {
                    setShowModal(false)
                    setMethod('text')
                  }}
                  isModal={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 'confirm' && confirmed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-center">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thanks for contributing!</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-5">Your submission has been received</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 mb-5">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Station:</span> {confirmed.station_name || confirmed.stationName || station?.name || 'Unknown'}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Fuel:</span> {confirmed.fuel_type || confirmed.fuelTypeName || 'Unknown'}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Price:</span> ${Number(confirmed.price || 0).toFixed(2)} /L
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setConfirmed(null)
                  setCurrentStep('station')
                  setPrice('')
                  setMethod('text')
                  setError(null)
                }}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Submit Another
              </button>
              <button
                onClick={() => navigate('/map')}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-900 dark:text-white transition-colors"
              >
                Go to Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceSubmissionForm
