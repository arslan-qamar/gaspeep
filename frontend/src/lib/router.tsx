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
          <DashboardPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
])
