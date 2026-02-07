import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { MapPage } from '../sections/map-and-station-browsing/pages/MapPage'
import { SignInPage } from '../pages/SignInPage'
import { SignUpPage } from '../pages/SignUpPage'

// Placeholder components for now
const PriceSubmissionForm = () => <div className="p-4">Price Submission - Coming Soon</div>
const AlertsList = () => <div className="p-4">Alerts - Coming Soon</div>
const ProfilePage = () => <div className="p-4">Profile - Coming Soon</div>
const DashboardPage = () => <div className="p-4">Dashboard - Coming Soon</div>

export const router = createBrowserRouter([
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
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
          <ProfilePage />
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
