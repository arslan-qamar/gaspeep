import { useState, useEffect, useCallback } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { MapPage } from '../sections/map-and-station-browsing/pages/MapPage'

// Section 5: User Authentication & Tiers
import {
  SignInScreen,
  SignUpScreen,
  OAuthCallback,
  AccountScreen,
  TierComparisonScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '../sections/user-authentication-and-tiers'

// Section 4: Price Submission System
import { PriceSubmissionForm } from '../sections/price-submission-system/PriceSubmissionForm'
import PriceSubmissionHistory from '../sections/price-submission-system/PriceSubmissionHistory'

// Section 6: Alerts & Notifications
import {
  AlertsListScreen,
  CreateAlertScreen,
  NotificationCenterScreen,
} from '../sections/alerts-and-notifications'

// Section 7: Station Owner Dashboard
import {
  StationOwnerDashboard,
  ClaimStationScreen,
  CreateBroadcastScreen,
  BroadcastDetailsScreen,
  StationDetailsScreen,
  AccountSettingsScreen,
} from '../sections/station-owner-dashboard'

import { useStationOwner } from '../hooks/useStationOwner'
import { ErrorBanner } from '../sections/station-owner-dashboard/ErrorBanner'
import { searchAvailableStations } from '../services/stationOwnerService'

// Dashboard page wrapper with API integration
const StationOwnerDashboardPage = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'claim' | 'create' | 'details' | 'station-details' | 'account-settings'>('dashboard')
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [dismissedError, setDismissedError] = useState(false)
  const [availableStations, setAvailableStations] = useState<any[]>([])
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

  // Request user geolocation on mount to set initial coordinates
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentSearchLat(position.coords.latitude)
        setCurrentSearchLng(position.coords.longitude)
      },
      (error) => {
        console.warn('Geolocation error:', error)
        // Keep default coordinates if geolocation fails
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  // Load available stations when entering claim view
  useEffect(() => {
    if (currentView === 'claim' && availableStations.length === 0 && !isSearchingStations) {
      const loadStations = async () => {
        setIsSearchingStations(true)
        try {
          const radius = 50 // km
          const stations = await searchAvailableStations('', currentSearchLat, currentSearchLng, radius)
          setAvailableStations(stations)
        } catch (err) {
          console.error('Failed to load available stations:', err)
          setAvailableStations([])
        } finally {
          setIsSearchingStations(false)
        }
      }

      loadStations()
    }
  }, [currentView, currentSearchLat, currentSearchLng])

  // Calculate radius based on zoom level (higher zoom = smaller radius)
  const getRadiusForZoom = (zoom: number): number => {
    // Zoom level to radius mapping:
    // Zoom 1-8: 50km (regional view)
    // Zoom 9-11: 40km
    // Zoom 12-13: 30km
    // Zoom 14-15: 20km
    // Zoom 16+: 10km (street level)
    if (zoom <= 8) return 50
    if (zoom <= 11) return 40
    if (zoom <= 13) return 30
    if (zoom <= 15) return 20
    return 10
  }

  // Handle station refresh when user uses geolocation
  const handleRefreshStations = useCallback(async (lat: number, lng: number, zoom: number = 14) => {
    setCurrentSearchLat(lat)
    setCurrentSearchLng(lng)
    setIsSearchingStations(true)
    try {
      const radius = getRadiusForZoom(zoom)
      const stations = await searchAvailableStations('', lat, lng, radius)
      setAvailableStations(stations)
    } catch (err) {
      console.error('Failed to refresh available stations:', err)
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
        onStationClaimed={(_stationId) => {
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
          try {
            await createBroadcast(data)
            setCurrentView('dashboard')
          } catch (_err) {
            console.error('Failed to create broadcast:', _err)
          }
        }}
        onCancel={() => setCurrentView('dashboard')}
        owner={owner}
      />
    )
  }

  if (currentView === 'details' && selectedBroadcastId) {
    const broadcast = broadcasts.find(b => b.id === selectedBroadcastId)
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
            onDuplicate={async (id) => {
              try {
                await duplicateBroadcast(id)
              } catch (err) {
                console.error('Failed to duplicate broadcast:', err)
              }
            }}
            onDelete={async (id) => {
              try {
                await deleteBroadcast(id)
                setCurrentView('dashboard')
              } catch (err) {
                console.error('Failed to delete broadcast:', err)
              }
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
    const station = stations.find(s => s.id === selectedStationId)
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
            broadcasts={broadcasts.filter(b => b.stationId === selectedStationId)}
            onSave={async (data) => {
              try {
                await updateStation({ stationId: selectedStationId, data })
              } catch (err) {
                console.error('Failed to update station:', err)
              }
            }}
            onBroadcast={() => {
              setSelectedStationId(selectedStationId)
              setCurrentView('create')
            }}
            onUnclaim={async (stationId: string) => {
              try {
                await unclaimStation(stationId)
                await refetch()
                setCurrentView('dashboard')
              } catch (err) {
                console.error('Failed to unclaim station:', err)
              }
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
          try {
            await updateStation({ stationId, data })
          } catch (err) {
            console.error('Failed to update station:', err)
          }
        }}
        onStationUnclaim={async (stationId) => {
          try {
            await unclaimStation(stationId)
            await refetch()
          } catch (err) {
            console.error('Failed to unclaim station:', err)
          }
        }}
        onRefresh={refetch}
        onAccountSettings={() => setCurrentView('account-settings')}
      />
    </>
  )
}

export const router = createBrowserRouter([
  // Authentication routes (public)
  {
    path: '/auth/signin',
    element: <SignInScreen />,
  },
  {
    path: '/auth/signup',
    element: <SignUpScreen />,
  },
  {
    path: '/auth/tier-comparison',
    element: <TierComparisonScreen />,
  },
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordScreen />,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordScreen />,
  },
  {
    path: '/auth/oauth/success',
    element: <OAuthCallback />,
  },
  {
    path: '/signin',
    element: <SignInScreen />,
  },
  {
    path: '/signup',
    element: <SignUpScreen />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell>
          <MapPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/map',
    element: (
      <ProtectedRoute>
        <AppShell>
          <MapPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/submit',
    element: (
      <ProtectedRoute>
        <AppShell>
          <PriceSubmissionForm />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/submissions',
    element: (
      <ProtectedRoute>
        <AppShell>
          <PriceSubmissionHistory />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts',
    element: (
      <ProtectedRoute>
        <AppShell>
          <AlertsListScreen />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts/create',
    element: (
      <ProtectedRoute>
        <AppShell>
          <CreateAlertScreen />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts/edit/:alertId',
    element: (
      <ProtectedRoute>
        <AppShell>
          <CreateAlertScreen />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <AppShell>
          <NotificationCenterScreen />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <AppShell>
          <AccountScreen />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <AppShell>
          <AccountScreen />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AppShell>
          <StationOwnerDashboardPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/station-owner',
    element: (
      <ProtectedRoute>
        <AppShell>
          <StationOwnerDashboardPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
])
