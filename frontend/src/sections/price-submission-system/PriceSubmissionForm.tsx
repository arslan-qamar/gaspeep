import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient, stationApi } from '../../lib/api'
import type { VoiceParseResult } from './voicePriceParser'
import { searchStationsNearby } from '../../services/stationsService'
import { calculateDistance } from '../../lib/utils'
import type { Station as MapStation } from '../map-and-station-browsing/types'
import { SubmissionHeader } from './components/SubmissionHeader'
import { StationSelectionStep } from './components/StationSelectionStep'
import { PriceEntryStep } from './components/PriceEntryStep'
import { EntryMethodModal } from './components/EntryMethodModal'
import { SubmissionConfirmationDialog } from './components/SubmissionConfirmationDialog'
import type { PhotoAnalysisResult } from './PhotoUploadScreen'
import type {
  SubmissionStep,
  FuelSubmissionEntry,
  VoiceReviewEntry,
  ConfirmedSubmission,
  StepMeta,
  Station,
  FuelType,
  MapViewport,
} from './PriceSubmissionForm.types'

export type { Station, FuelType } from './PriceSubmissionForm.types'

export const PriceSubmissionForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('station')
  const [station, setStation] = useState<Station | null>(null)
  const [fuelType, setFuelType] = useState<string>('')
  const [pricesByFuelType, setPricesByFuelType] = useState<Record<string, string>>({})
  const [method, setMethod] = useState<'text' | 'voice' | 'photo'>('text')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<ConfirmedSubmission | null>(null)

  const [fuelTypesList, setFuelTypesList] = useState<FuelType[]>([])

  const [stationQuery, setStationQuery] = useState('')
  const [nearbyStations, setNearbyStations] = useState<Station[]>([])
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  const [mapFocusLocation, setMapFocusLocation] = useState<{ lat: number; lng: number; zoom: number } | null>(null)
  const [debouncedStationQuery, setDebouncedStationQuery] = useState('')
  const [showStationDropdown, setShowStationDropdown] = useState(false)
  const [voiceParseResult, setVoiceParseResult] = useState<VoiceParseResult | null>(null)
  const [voiceReviewEntries, setVoiceReviewEntries] = useState<VoiceReviewEntry[]>([])
  const [voiceReviewError, setVoiceReviewError] = useState<string | null>(null)
  const [photoAnalysisMetadata, setPhotoAnalysisMetadata] = useState<{ photoUrl?: string; ocrData?: string } | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMountedRef = useRef(true)

  const steps: StepMeta[] = [
    { number: 1, label: 'Select Station' },
    { number: 2, label: 'Submit Price' },
    { number: 3, label: 'Confirmation' },
  ]

  const currentStepNumber =
    currentStep === 'station' ? 1 : currentStep === 'submit' ? 2 : 3

  const resetVoiceFlow = useCallback(() => {
    setVoiceParseResult(null)
    setVoiceReviewEntries([])
    setVoiceReviewError(null)
  }, [])

  // Prefill station / fuel type from navigation state (e.g. from map)
  useEffect(() => {
    const state = (location.state || {}) as any

    if (state?.fuelTypeId) {
      setFuelType(state.fuelTypeId)
    }

    if (state?.stationId) {
      setCurrentStep('submit')

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

  const fetchNearby = useCallback(async (lat: number, lng: number, query: string) => {
    setIsLoadingStations(true)
    try {
      const response = await searchStationsNearby({
        latitude: lat,
        longitude: lng,
        radiusKm: 150,
        query: query.trim() || undefined,
      })

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
        .sort((a: Station, b: Station) => (a.distance || 0) - (b.distance || 0))

      if (!isMountedRef.current) return
      setNearbyStations(mapped)
    } catch (_err) {
      if (!isMountedRef.current) return
      setNearbyStations([])
    } finally {
      if (!isMountedRef.current) return
      setIsLoadingStations(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedStationQuery(stationQuery)
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [stationQuery])

  useEffect(() => {
    if (!mapViewport) return
    fetchNearby(mapViewport.latitude, mapViewport.longitude, debouncedStationQuery)
  }, [mapViewport, debouncedStationQuery, fetchNearby])

  const mapStations = useMemo<MapStation[]>(() => {
    const stationsForMap =
      station &&
      typeof station.latitude === 'number' &&
      typeof station.longitude === 'number' &&
      !nearbyStations.some((nearby) => nearby.id === station.id)
        ? [station, ...nearbyStations]
        : nearbyStations

    return stationsForMap
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
  }, [nearbyStations, station])

  const selectStation = useCallback((selectedStation: Station) => {
    setStation(selectedStation)
    setStationQuery(selectedStation.name)
    setShowStationDropdown(false)

    if (typeof selectedStation.latitude === 'number' && typeof selectedStation.longitude === 'number') {
      const focus = { lat: selectedStation.latitude, lng: selectedStation.longitude, zoom: 15 }
      setMapViewport({
        latitude: focus.lat,
        longitude: focus.lng,
        zoom: focus.zoom,
      })
      setMapFocusLocation(focus)
    }
  }, [])

  const handleMapStationSelect = useCallback((selected: MapStation) => {
    const chosen = nearbyStations.find((s) => s.id === selected.id)
    if (chosen) {
      selectStation(chosen)
      return
    }

    selectStation({
      id: selected.id,
      name: selected.name,
      address: selected.address,
      brand: selected.brand,
      latitude: selected.latitude,
      longitude: selected.longitude,
    })
  }, [nearbyStations, selectStation])

  const enteredFuelEntries = useMemo(() => {
    return fuelTypesList
      .map((f) => {
        const raw = (pricesByFuelType[f.id] || '').trim()
        if (!raw) return null

        const parsed = parseFloat(raw)
        return {
          fuelTypeId: f.id,
          fuelTypeName: f.displayName || f.name,
          raw,
          parsed,
        }
      })
      .filter((entry): entry is { fuelTypeId: string; fuelTypeName: string; raw: string; parsed: number } => Boolean(entry))
  }, [fuelTypesList, pricesByFuelType])

  const hasInvalidEntry = useMemo(() => {
    return enteredFuelEntries.some((entry) => isNaN(entry.parsed) || entry.parsed <= 0)
  }, [enteredFuelEntries])

  const resolveFuelTypeId = useCallback(
    (input: string) => {
      const exactId = fuelTypesList.find((f) => f.id === input)
      if (exactId) return exactId.id

      const normalized = input.trim().toLowerCase()
      const compact = normalized.replace(/[^a-z0-9]/g, '')
      const hasToken = (token: string) =>
        normalized.includes(token) || compact.includes(token.replace(/[^a-z0-9]/g, ''))
      const findBy = (predicate: (value: string) => boolean) =>
        fuelTypesList.find((f) => {
          const name = f.name.toLowerCase()
          const display = (f.displayName || '').toLowerCase()
          const compactName = name.replace(/[^a-z0-9]/g, '')
          const compactDisplay = display.replace(/[^a-z0-9]/g, '')
          return (
            predicate(name) ||
            predicate(display) ||
            predicate(compactName) ||
            predicate(compactDisplay)
          )
        })

      // Common OCR labels -> canonical fuel types.
      if (hasToken('e10')) {
        const match = findBy((value) => value.includes('e10'))
        if (match) return match.id
      }
      if (hasToken('e85')) {
        const match = findBy((value) => value.includes('e85'))
        if (match) return match.id
      }
      if (hasToken('adblue')) {
        const match = findBy((value) => value.includes('adblue'))
        if (match) return match.id
      }
      if (hasToken('lpg')) {
        const match = findBy((value) => value.includes('lpg'))
        if (match) return match.id
      }
      if (hasToken('biodiesel')) {
        const match = findBy((value) => value.includes('biodiesel'))
        if (match) return match.id
      }
      if (hasToken('truckdiesel') || (hasToken('truck') && hasToken('diesel'))) {
        const match = findBy((value) => value.includes('truck') && value.includes('diesel'))
        if (match) return match.id
      }
      if (hasToken('premiumdiesel') || (hasToken('premium') && hasToken('diesel'))) {
        const match = findBy((value) => value.includes('premium') && value.includes('diesel'))
        if (match) return match.id
      }
      if (hasToken('diesel')) {
        const match = findBy(
          (value) =>
            value.includes('diesel') &&
            !value.includes('premium') &&
            !value.includes('truck') &&
            !value.includes('bio')
        )
        if (match) return match.id
      }
      if (hasToken('98')) {
        const match = findBy((value) => value.includes('98') || value.includes('u98'))
        if (match) return match.id
      }
      if (hasToken('95')) {
        const match = findBy((value) => value.includes('95') || value.includes('u95'))
        if (match) return match.id
      }
      if (
        hasToken('91') ||
        hasToken('ulp') ||
        hasToken('unleaded') ||
        hasToken('regular')
      ) {
        const match = findBy(
          (value) => value.includes('91') || value.includes('unleaded') || value.includes('ulp')
        )
        if (match) return match.id
      }

      const byName = fuelTypesList.find(
        (f) =>
          f.name.toLowerCase() === normalized ||
          (f.displayName || '').toLowerCase() === normalized
      )
      if (byName) return byName.id

      const byContains = fuelTypesList.find(
        (f) =>
          f.name.toLowerCase().includes(normalized) ||
          (f.displayName || '').toLowerCase().includes(normalized) ||
          normalized.includes(f.name.toLowerCase()) ||
          normalized.includes((f.displayName || '').toLowerCase())
      )

      return byContains?.id || ''
    },
    [fuelTypesList]
  )

  const applyVoiceSelections = useCallback(() => {
    const approvedEntries = voiceReviewEntries
      .filter((entry) => entry.selected)
      .map((entry) => ({
        fuelTypeId: entry.fuelTypeId,
        price: parseFloat(entry.price),
      }))
      .filter((entry) => entry.fuelTypeId && Number.isFinite(entry.price) && entry.price > 0)

    if (approvedEntries.length === 0) {
      setVoiceReviewError('Select at least one valid fuel entry to apply.')
      return
    }

    setPricesByFuelType((previous) => {
      const next = { ...previous }
      approvedEntries.forEach((entry) => {
        next[entry.fuelTypeId] = entry.price.toFixed(2)
      })
      return next
    })
    setFuelType(approvedEntries[0].fuelTypeId)
    setShowModal(false)
    resetVoiceFlow()
  }, [resetVoiceFlow, voiceReviewEntries])

  async function submit() {
    setError(null)
    if (!station) return setError('Please select a station')
    if (enteredFuelEntries.length === 0) return setError('Enter at least one fuel price')
    if (hasInvalidEntry) return setError('All entered prices must be valid positive numbers')

    const submissionPayloads = enteredFuelEntries.map((entry) => ({
      fuelTypeId: entry.fuelTypeId,
      fuelTypeName: entry.fuelTypeName,
      price: entry.parsed,
    }))

    if (submissionPayloads.some((entry) => entry.price > 100)) {
      if (!confirm('One or more prices entered look unusually high. Submit anyway?')) return
    }

    setLoading(true)
    try {
      const response = await apiClient.post('/price-submissions', {
        ...(method === 'photo' && photoAnalysisMetadata?.photoUrl
          ? { photoUrl: photoAnalysisMetadata.photoUrl }
          : {}),
        ...(method === 'photo' && photoAnalysisMetadata?.ocrData
          ? { ocrData: photoAnalysisMetadata.ocrData }
          : {}),
        stationId: station.id,
        submissionMethod: method,
        entries: submissionPayloads.map((entry) => ({
          fuelTypeId: entry.fuelTypeId,
          price: entry.price,
        })),
      })

      const responseEntries = Array.isArray(response.data?.submissions)
        ? response.data.submissions
        : [response.data]

      const submittedEntries: FuelSubmissionEntry[] = submissionPayloads.map((entry) => ({
        fuelTypeId: entry.fuelTypeId,
        fuelTypeName: entry.fuelTypeName,
        price: entry.price,
      }))

      try {
        const key = 'price_submission_history'
        const existingRaw = localStorage.getItem(key)
        const existing = existingRaw ? JSON.parse(existingRaw) : []
        const newRecords = submittedEntries.map((entry, index) => {
          const data = responseEntries[index] || {}
          return {
            id: data.id || `local-${Date.now()}-${entry.fuelTypeId}`,
            station_name: station.name,
            fuel_type: entry.fuelTypeName,
            price: entry.price,
            submittedAt: data.submittedAt || new Date().toISOString(),
            moderationStatus: data.moderationStatus || data.status || 'pending',
          }
        })
        const next = newRecords.concat(existing).slice(0, 50)
        localStorage.setItem(key, JSON.stringify(next))

        queryClient.setQueryData(['my-submissions', 1], (previous: any) => {
          const existingItems = Array.isArray(previous?.items) ? previous.items : []
          return {
            ...(previous || {}),
            items: [...newRecords, ...existingItems],
            pagination: previous?.pagination || null,
          }
        })
      } catch (_err) {
        // ignore localStorage errors
      }

      queryClient.invalidateQueries({ queryKey: ['my-submissions'] })

      const firstResponse = responseEntries[0] || {}
      const singleFuelSummary = submittedEntries.length === 1
      setConfirmed({
        ...firstResponse,
        station_name: station?.name || firstResponse.station_name || firstResponse.stationName,
        fuel_type: singleFuelSummary
          ? submittedEntries[0].fuelTypeName
          : `${submittedEntries.length} fuel types submitted`,
        submittedEntries,
      })
      setCurrentStep('confirm')
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const closeEntryModal = useCallback(() => {
    setShowModal(false)
    setMethod('text')
    setPhotoAnalysisMetadata(null)
    resetVoiceFlow()
  }, [resetVoiceFlow])

  const handleVoiceParsed = useCallback((data: VoiceParseResult) => {
    const reviewEntries: VoiceReviewEntry[] = data.candidates.map((candidate, index) => {
      const fallbackFuelTypeId =
        candidate.normalizedFuelId || resolveFuelTypeId(candidate.spokenFuel)

      return {
        id: `${index}-${candidate.spokenFuel}`,
        selected: Boolean(fallbackFuelTypeId),
        spokenFuel: candidate.spokenFuel,
        fuelTypeId: fallbackFuelTypeId,
        price: candidate.price.toFixed(2),
        confidence: candidate.confidence,
      }
    })

    setVoiceReviewError(null)
    setVoiceParseResult(data)
    setVoiceReviewEntries(reviewEntries)
  }, [resolveFuelTypeId])

  const handlePhotoParsed = useCallback((data: PhotoAnalysisResult) => {
    const resolvedEntries = data.entries
      .map((entry) => {
        const fuelTypeId = resolveFuelTypeId(entry.fuelType)
        if (!fuelTypeId) return null
        return {
          fuelTypeId,
          price: entry.price,
        }
      })
      .filter((entry): entry is { fuelTypeId: string; price: number } => Boolean(entry))

    if (resolvedEntries.length === 0) {
      setError('Photo analyzed, but no detected fuel types matched supported options.')
      return
    }

    setPricesByFuelType((previous) => {
      const next = { ...previous }
      resolvedEntries.forEach((entry) => {
        next[entry.fuelTypeId] = entry.price.toFixed(2)
      })
      return next
    })
    setFuelType(resolvedEntries[0].fuelTypeId)

    setPhotoAnalysisMetadata({
      photoUrl: data.photoUrl,
      ocrData: data.ocrData,
    })
    setError(null)
    setMethod('photo')
    setShowModal(false)
  }, [resolveFuelTypeId])

  const canSubmit =
    !loading && Boolean(station) && enteredFuelEntries.length > 0 && !hasInvalidEntry

  return (
     <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <SubmissionHeader currentStepNumber={currentStepNumber} steps={steps} />

        {currentStep === 'station' && (
          <StationSelectionStep
            stationQuery={stationQuery}
            setStationQuery={setStationQuery}
            showStationDropdown={showStationDropdown}
            setShowStationDropdown={setShowStationDropdown}
            isLoadingStations={isLoadingStations}
            nearbyStations={nearbyStations}
            station={station}
            selectStation={selectStation}
            userLocation={userLocation}
            mapViewport={mapViewport}
            mapStations={mapStations}
            mapFocusLocation={mapFocusLocation}
            onMapStationSelect={handleMapStationSelect}
            setMapViewport={setMapViewport}
            onContinue={() => setCurrentStep('submit')}
          />
        )}

        {currentStep === 'submit' && (
          <PriceEntryStep
            station={station}
            fuelTypesList={fuelTypesList}
            fuelType={fuelType}
            pricesByFuelType={pricesByFuelType}
            setPricesByFuelType={setPricesByFuelType}
            setFuelType={setFuelType}
            error={error}
            loading={loading}
            canSubmit={canSubmit}
            onBack={() => setCurrentStep('station')}
            onSubmit={submit}
            onVoiceEntry={() => {
              setMethod('voice')
              setPhotoAnalysisMetadata(null)
              resetVoiceFlow()
              setShowModal(true)
            }}
            onPhotoEntry={() => {
              setMethod('photo')
              setPhotoAnalysisMetadata(null)
              resetVoiceFlow()
              setShowModal(true)
            }}
          />
        )}
      
      </div>

      <EntryMethodModal
        showModal={showModal}
        method={method}
        voiceParseResult={voiceParseResult}
        voiceReviewEntries={voiceReviewEntries}
        setVoiceReviewEntries={setVoiceReviewEntries}
        voiceReviewError={voiceReviewError}
        fuelTypesList={fuelTypesList}
        applyVoiceSelections={applyVoiceSelections}
        resetVoiceFlow={resetVoiceFlow}
        onClose={closeEntryModal}
        onVoiceParsed={handleVoiceParsed}
        onPhotoParsed={handlePhotoParsed}
      />

      <SubmissionConfirmationDialog
        currentStep={currentStep}
        confirmed={confirmed}
        station={station}
        onSubmitAnother={() => {
          setConfirmed(null)
          setCurrentStep('station')
          setFuelType('')
          setPricesByFuelType({})
          setMethod('text')
          setPhotoAnalysisMetadata(null)
          setError(null)
          resetVoiceFlow()
        }}
        onGoToMap={() => navigate('/map')}
      />
    </div>
  )
}

export default PriceSubmissionForm
