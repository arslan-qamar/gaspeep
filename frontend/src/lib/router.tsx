import React, { useState } from 'react'
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
} from '../sections/station-owner-dashboard'

// Sample data for station owner dashboard
import sampleData from '../__tests__/fixtures/station-owner-dashboard-sample-data.json'

// Dashboard page wrapper with sample data
const StationOwnerDashboardPage = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'claim' | 'create' | 'details' | 'station-details'>('dashboard')
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

  if (currentView === 'claim') {
    return (
      <ClaimStationScreen
        availableStations={sampleData.claimedStations}
        onStationClaimed={(stationId) => {
          setCurrentView('dashboard')
        }}
        onCancel={() => setCurrentView('dashboard')}
      />
    )
  }

  if (currentView === 'create') {
    return (
      <CreateBroadcastScreen
        stations={sampleData.claimedStations}
        fuelTypes={sampleData.fuelTypes}
        selectedStationId={selectedStationId || undefined}
        onSubmit={(data) => {
          setCurrentView('dashboard')
        }}
        onCancel={() => setCurrentView('dashboard')}
        owner={sampleData.stationOwner}
      />
    )
  }

  if (currentView === 'details' && selectedBroadcastId) {
    const broadcast = sampleData.broadcasts.find(b => b.id === selectedBroadcastId)
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
            onDuplicate={(id) => {
              setCurrentView('create')
            }}
            onDelete={(id) => {
              setCurrentView('dashboard')
            }}
            onCancel={(id) => {
              setCurrentView('dashboard')
            }}
          />
        </div>
      )
    }
  }

  if (currentView === 'station-details' && selectedStationId) {
    const station = sampleData.claimedStations.find(s => s.id === selectedStationId)
    if (station) {
      const fuelPrices = (sampleData.currentFuelPrices as Record<string, any>)[selectedStationId] || []
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
            broadcasts={sampleData.broadcasts.filter(b => b.stationId === selectedStationId)}
            onSave={(data) => {}}
            onBroadcast={() => setCurrentView('create')}
            onUnclaim={() => setCurrentView('dashboard')}
          />
        </div>
      )
    }
  }

  return (
    <StationOwnerDashboard
      owner={sampleData.stationOwner}
      stations={sampleData.claimedStations}
      broadcasts={sampleData.broadcasts}
      stats={sampleData.dashboardStats}
      fuelTypes={sampleData.fuelTypes}
      onClaimStation={() => setCurrentView('claim')}
      onCreateBroadcast={(stationId) => {
        setSelectedStationId(stationId || null)
        setCurrentView('create')
      }}
      onViewBroadcast={(broadcastId) => {
        setSelectedBroadcastId(broadcastId)
        setCurrentView('details')
      }}
    />
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
