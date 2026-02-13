import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { stationApi } from '../../lib/api'
import { VoiceInputScreen } from './VoiceInputScreen'
import { PhotoUploadScreen } from './PhotoUploadScreen'
import { SubmissionConfirmation } from './SubmissionConfirmation'
import PriceSubmissionHistory from './PriceSubmissionHistory'
import { apiClient } from '../../lib/api'

export type Station = { id: string; name: string; address?: string; brand?: string; distance?: number }
export type FuelType = { id: string; name: string; displayName?: string }

export const PriceSubmissionForm: React.FC = () => {
  const [station, setStation] = useState<Station | null>(null)
  const [fuelType, setFuelType] = useState<string>('E10')
  const [price, setPrice] = useState<string>('')
  const [method, setMethod] = useState<'text' | 'voice' | 'photo'>('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<any>(null)
  const [stationQuery, setStationQuery] = useState('')
  const [stationSuggestions, setStationSuggestions] = useState<Station[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const queryTimer = useRef<number | null>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)

  const [fuelTypesList, setFuelTypesList] = useState<FuelType[]>([])

  const location = useLocation()

  // Prefill station / fuel type from navigation state (e.g. from map)
  useEffect(() => {
    const state = (location.state || {}) as any
    if (state?.stationId) {
      ;(async () => {
        try {
          const resp = await stationApi.getStation(state.stationId)
          const data = resp.data
          setStation({ id: data.id, name: data.name, address: data.address, brand: (data as any).brand })
        } catch (err) {
          // ignore
        }
      })()
    }
    if (state?.fuelTypeId) {
      setFuelType(state.fuelTypeId)
    }
  }, [location.state])

  // Load fuel types on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await apiClient.get('/fuel-types')
        if (!mounted) return
        setFuelTypesList(resp.data || [])
        if (!fuelType && resp.data && resp.data.length > 0) {
          setFuelType(resp.data[0].id)
        }
      } catch (err) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const parsedPrice = useMemo(() => parseFloat(price || ''), [price])

  async function submit() {
    setError(null)
    if (!station) return setError('Please select a station')
    if (!fuelType) return setError('Please select a fuel type')
    if (isNaN(parsedPrice)) return setError('Price must be a number')
    if (parsedPrice <= 0) return setError('Price must be positive')
    if (parsedPrice > 100) {
      // allow override but warn
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
      // Attach resolved station/fuel display names from local state for immediate feedback
      const fuelDisplay = (fuelTypesList || []).find((f: any) => f.id === fuelType)
      const enhanced = Object.assign({}, data, {
        station_name: station?.name || data.station_name || data.stationName,
        fuel_type: (fuelDisplay && (fuelDisplay.displayName || fuelDisplay.name)) || data.fuel_type || data.fuelTypeName,
      })
      // persist a lightweight history record in localStorage for quick access
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
      } catch (err) {
        // ignore localStorage errors
      }
      setConfirmed(enhanced)
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) return <SubmissionConfirmation submission={confirmed} onDone={() => setConfirmed(null)} />

  // Method selection screen
  if (method === 'voice') {
    return (
      <VoiceInputScreen
        onParsed={(data) => {
          setStation(data.station)
          setFuelType(data.fuelType)
          setPrice(String(data.price))
          setMethod('text')
        }}
        onCancel={() => setMethod('text')}
      />
    )
  }

  if (method === 'photo') {
    return (
      <PhotoUploadScreen
        onParsed={(data) => {
          setStation(data.station)
          setFuelType(data.fuelType)
          setPrice(String(data.price))
          setMethod('text')
        }}
        onCancel={() => setMethod('text')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Submit Fuel Price</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Help the community by sharing current prices
        </p>

        {/* Method Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setMethod('text')}
            className="p-6 border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 rounded-lg transition-all text-center space-y-2"
          >
            <div className="text-3xl">📝</div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Manual Entry</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Type the price directly</p>
          </button>

          <button
            onClick={() => setMethod('voice')}
            className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center space-y-2"
          >
            <div className="text-3xl">🎤</div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Voice Entry</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Speak the price</p>
          </button>

          <button
            onClick={() => setMethod('photo')}
            className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center space-y-2"
          >
            <div className="text-3xl">📸</div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Photo Upload</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Photo of pump/receipt</p>
          </button>
        </div>

        {/* Manual Entry Form */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Enter Price Details</h2>

          {/* Station Search */}
          <div className="mb-6 relative" ref={suggestionRef}>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Station *</label>
            {station ? (
              <div className="flex items-center gap-2 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">{station.name}</div>
                  {station.address && <div className="text-sm text-slate-600 dark:text-slate-400">{station.address}</div>}
                </div>
                <button
                  onClick={() => {
                    setStation(null)
                    setStationQuery('')
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  aria-label="station"
                  value={stationQuery}
                  onChange={(e) => {
                    setStationQuery(e.target.value)
                    setShowSuggestions(true)
                    if (queryTimer.current) window.clearTimeout(queryTimer.current)
                    queryTimer.current = window.setTimeout(async () => {
                      try {
                        const resp = await apiClient.get('/stations/search', { params: { q: e.target.value } })
                        setStationSuggestions(resp.data || [])
                      } catch (err) {
                        setStationSuggestions([])
                      }
                    }, 300)
                  }}
                  placeholder="Search for a station..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onFocus={() => setShowSuggestions(true)}
                />

                {showSuggestions && stationSuggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mt-1 max-h-64 overflow-auto shadow-lg">
                    {stationSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                        onMouseDown={() => {
                          setStation(s)
                          setStationQuery('')
                          setStationSuggestions([])
                          setShowSuggestions(false)
                        }}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{s.address}</div>
                        {s.distance !== undefined && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.distance.toFixed(1)} km away</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Fuel Type */}
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

          {/* Price Input */}
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

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={submit}
            disabled={loading || !station || !fuelType || isNaN(parsedPrice) || parsedPrice <= 0}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
              loading || !station || !fuelType || isNaN(parsedPrice) || parsedPrice <= 0
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Price'}
          </button>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Submit accurate prices to help the community</li>
              <li>• All submissions are reviewed before going live</li>
              <li>• You earn points for verified submissions</li>
            </ul>
          </div>
        </div>

        {/* Recent Submissions */}
        <PriceSubmissionHistory />
      </div>
    </div>
  )
}

export default PriceSubmissionForm
