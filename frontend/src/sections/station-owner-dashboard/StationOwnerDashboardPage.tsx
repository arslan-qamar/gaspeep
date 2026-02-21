import { useState, useEffect, useCallback } from 'react'
import { useStationOwner } from '../../hooks/useStationOwner'
import { searchAvailableStations } from '../../services/stationOwnerService'
import type { AvailableStation } from './types'
import { ErrorBanner } from './ErrorBanner'
import { StationOwnerDashboard } from './StationOwnerDashboard'
import { ClaimStationScreen } from './ClaimStationScreen'
import { CreateBroadcastScreen } from './CreateBroadcastScreen'
import { BroadcastDetailsScreen } from './BroadcastDetailsScreen'
import { StationDetailsScreen } from './StationDetailsScreen'
import { AccountSettingsScreen } from './AccountSettingsScreen'

export const StationOwnerDashboardPage = () => {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'claim' | 'create' | 'details' | 'station-details' | 'account-settings'
  >('dashboard')
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [dismissedError, setDismissedError] = useState(false)
  const [availableStations, setAvailableStations] = useState<AvailableStation[]>([])
  const [isSearchingStations, setIsSearchingStations] = useState(false)
  const [currentSearchLat, setCurrentSearchLat] = useState<number>(-33.8688)
  const [currentSearchLng, setCurrentSearchLng] = useState<number>(151.2093)

  const {
    owner,
    stations,
    broadcasts,
    stats,
    fuelTypes,
    currentFuelPrices,
    isLoading,
    error,
    refetch,
    claimStation,
    isClaimingStation,
    claimStationError,
    unclaimStation,
    updateStation,
    createBroadcast,
    deleteBroadcast,
    duplicateBroadcast,
    updateProfile,
    isUpdatingProfile,
  } = useStationOwner()

  const handleRetry = () => {
    setDismissedError(false)
    refetch()
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentSearchLat(position.coords.latitude)
        setCurrentSearchLng(position.coords.longitude)
      },
      () => {
        // Keep defaults if geolocation fails.
      },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  useEffect(() => {
    if (currentView === 'claim' && availableStations.length === 0 && !isSearchingStations) {
      const loadStations = async () => {
        setIsSearchingStations(true)
        try {
          const radius = 50
          const stations = await searchAvailableStations('', currentSearchLat, currentSearchLng, radius)
          setAvailableStations(stations)
        } catch {
          setAvailableStations([])
        } finally {
          setIsSearchingStations(false)
        }
      }

      void loadStations()
    }
  }, [currentView, currentSearchLat, currentSearchLng, availableStations.length, isSearchingStations])

  const getRadiusForZoom = (zoom: number): number => {
    if (zoom <= 8) return 50
    if (zoom <= 11) return 40
    if (zoom <= 13) return 30
    if (zoom <= 15) return 20
    return 10
  }

  const handleRefreshStations = useCallback(async (lat: number, lng: number, zoom: number = 14) => {
    setCurrentSearchLat(lat)
    setCurrentSearchLng(lng)
    setIsSearchingStations(true)
    try {
      const radius = getRadiusForZoom(zoom)
      const stations = await searchAvailableStations('', lat, lng, radius)
      setAvailableStations(stations)
    } finally {
      setIsSearchingStations(false)
    }
  }, [])

  if (currentView === 'claim') {
    return (
      <ClaimStationScreen
        availableStations={availableStations}
        isLoading={isSearchingStations}
        isSubmitting={isClaimingStation}
        claimError={claimStationError?.message || null}
        onRefreshStations={handleRefreshStations}
        onClaim={async (stationId, verificationMethod, documentUrls) => {
          await claimStation({
            stationId,
            verificationMethod,
            documentUrls,
          })
        }}
        onStationClaimed={() => {
          setCurrentView('dashboard')
        }}
        onCancel={() => setCurrentView('dashboard')}
      />
    )
  }

  if (currentView === 'create') {
    return (
      <CreateBroadcastScreen
        stations={stations}
        fuelTypes={fuelTypes}
        selectedStationId={selectedStationId || undefined}
        onSubmit={async (data) => {
          await createBroadcast(data)
          setCurrentView('dashboard')
        }}
        onCancel={() => setCurrentView('dashboard')}
        owner={owner}
      />
    )
  }

  if (currentView === 'details' && selectedBroadcastId) {
    const broadcast = broadcasts.find((b) => b.id === selectedBroadcastId)
    if (broadcast) {
      return (
        <div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="mb-4 px-4 py-2 bg-slate-600 text-white rounded"
          >
            ← Back to Dashboard
          </button>
          <BroadcastDetailsScreen
            broadcast={broadcast}
            onEdit={(id) => {
              setSelectedBroadcastId(id)
              setCurrentView('create')
            }}
            onDuplicate={duplicateBroadcast}
            onDelete={async (id) => {
              await deleteBroadcast(id)
              setCurrentView('dashboard')
            }}
            onCancel={() => {
              setCurrentView('dashboard')
            }}
          />
        </div>
      )
    }
  }

  if (currentView === 'station-details' && selectedStationId) {
    const station = stations.find((s) => s.id === selectedStationId)
    if (station) {
      const fuelPrices = currentFuelPrices[selectedStationId] || []
      return (
        <div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="mb-4 px-4 py-2 bg-slate-600 text-white rounded"
          >
            ← Back to Dashboard
          </button>
          <StationDetailsScreen
            station={station}
            fuelPrices={fuelPrices}
            broadcasts={broadcasts.filter((b) => b.stationId === selectedStationId)}
            onSave={async (data) => {
              await updateStation({ stationId: selectedStationId, data })
            }}
            onBroadcast={() => {
              setSelectedStationId(selectedStationId)
              setCurrentView('create')
            }}
            onUnclaim={async (stationId: string) => {
              await unclaimStation(stationId)
              await refetch()
              setCurrentView('dashboard')
            }}
          />
        </div>
      )
    }
  }

  if (currentView === 'account-settings' && owner) {
    return (
      <AccountSettingsScreen
        owner={owner}
        onBack={() => setCurrentView('dashboard')}
        isSaving={isUpdatingProfile}
        onSave={async (data) => {
          await updateProfile(data)
          setCurrentView('dashboard')
        }}
      />
    )
  }

  return (
    <>
      <ErrorBanner
        error={dismissedError ? null : error}
        onRetry={handleRetry}
        onDismiss={() => setDismissedError(true)}
      />
      <StationOwnerDashboard
        owner={owner}
        stations={stations}
        broadcasts={broadcasts}
        stats={stats}
        fuelTypes={fuelTypes}
        currentFuelPrices={currentFuelPrices}
        isLoading={isLoading}
        onClaimStation={() => setCurrentView('claim')}
        onCreateBroadcast={(stationId) => {
          setSelectedStationId(stationId || null)
          setCurrentView('create')
        }}
        onViewBroadcast={(broadcastId) => {
          setSelectedBroadcastId(broadcastId)
          setCurrentView('details')
        }}
        onStationSave={async (stationId, data) => {
          await updateStation({ stationId, data })
        }}
        onStationUnclaim={async (stationId) => {
          await unclaimStation(stationId)
          await refetch()
        }}
        onRefresh={refetch}
        onAccountSettings={() => setCurrentView('account-settings')}
      />
    </>
  )
}
