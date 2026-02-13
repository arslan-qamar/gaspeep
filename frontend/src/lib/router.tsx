import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { MapPage } from '../sections/map-and-station-browsing/pages/MapPage'

// Section 5: User Authentication & Tiers
import {
  SignInScreen,
  SignUpScreen,
  AccountScreen,
  TierComparisonScreen,
} from '../sections/user-authentication-and-tiers'

import { PriceSubmissionForm } from '../sections/price-submission-system/PriceSubmissionForm'
import PriceSubmissionHistory from '../sections/price-submission-system/PriceSubmissionHistory'
const AlertsList = () => <div className="p-4">Alerts - Coming Soon</div>
const DashboardPage = () => <div className="p-4">Dashboard - Coming Soon</div>

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
          <AlertsList />
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
          <DashboardPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
])
