import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { ProtectedRoute } from './ProtectedRoute'

const SignInScreen = lazy(() =>
  import('../sections/user-authentication-and-tiers/screens/SignInScreen').then((module) => ({
    default: module.SignInScreen,
  })),
)
const SignUpScreen = lazy(() =>
  import('../sections/user-authentication-and-tiers/screens/SignUpScreen').then((module) => ({
    default: module.SignUpScreen,
  })),
)
const TierComparisonScreen = lazy(() =>
  import('../sections/user-authentication-and-tiers/screens/TierComparisonScreen').then((module) => ({
    default: module.TierComparisonScreen,
  })),
)
const ForgotPasswordScreen = lazy(() =>
  import('../sections/user-authentication-and-tiers/screens/ForgotPasswordScreen').then((module) => ({
    default: module.ForgotPasswordScreen,
  })),
)
const ResetPasswordScreen = lazy(() =>
  import('../sections/user-authentication-and-tiers/screens/ResetPasswordScreen').then((module) => ({
    default: module.ResetPasswordScreen,
  })),
)
const OAuthCallback = lazy(() => import('../sections/user-authentication-and-tiers/screens/OAuthCallback'))
const AccountScreen = lazy(() =>
  import('../sections/user-authentication-and-tiers/screens/AccountScreen').then((module) => ({
    default: module.AccountScreen,
  })),
)
const MapPage = lazy(() =>
  import('../sections/map-and-station-browsing/pages/MapPage').then((module) => ({
    default: module.MapPage,
  })),
)
const PriceSubmissionForm = lazy(() =>
  import('../sections/price-submission-system/PriceSubmissionForm').then((module) => ({
    default: module.PriceSubmissionForm,
  })),
)
const PriceSubmissionHistory = lazy(() =>
  import('../sections/price-submission-system/PriceSubmissionHistory').then((module) => ({
    default: module.default,
  })),
)
const AlertsListScreen = lazy(() =>
  import('../sections/alerts-and-notifications/screens/AlertsListScreen').then((module) => ({
    default: module.AlertsListScreen,
  })),
)
const CreateAlertScreen = lazy(() =>
  import('../sections/alerts-and-notifications/screens/CreateAlertScreen').then((module) => ({
    default: module.CreateAlertScreen,
  })),
)
const AlertDetailsScreen = lazy(() =>
  import('../sections/alerts-and-notifications/screens/AlertDetailsScreen').then((module) => ({
    default: module.AlertDetailsScreen,
  })),
)
const NotificationCenterScreen = lazy(() =>
  import('../sections/alerts-and-notifications/screens/NotificationCenterScreen').then((module) => ({
    default: module.NotificationCenterScreen,
  })),
)
const StationOwnerDashboardPage = lazy(() =>
  import('../sections/station-owner-dashboard/StationOwnerDashboardPage').then((module) => ({
    default: module.StationOwnerDashboardPage,
  })),
)

const routeLoadingElement = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-slate-600 dark:text-slate-300">Loading...</div>
  </div>
)

const withSuspense = (element: ReactNode) => <Suspense fallback={routeLoadingElement}>{element}</Suspense>

const withProtectedShell = (element: ReactNode) =>
  withSuspense(
    <ProtectedRoute>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>,
  )

export const router = createBrowserRouter([
  {
    path: '/auth/signin',
    element: withSuspense(<SignInScreen />),
  },
  {
    path: '/auth/signup',
    element: withSuspense(<SignUpScreen />),
  },
  {
    path: '/auth/tier-comparison',
    element: withSuspense(<TierComparisonScreen />),
  },
  {
    path: '/auth/forgot-password',
    element: withSuspense(<ForgotPasswordScreen />),
  },
  {
    path: '/auth/reset-password',
    element: withSuspense(<ResetPasswordScreen />),
  },
  {
    path: '/auth/oauth/success',
    element: withSuspense(<OAuthCallback />),
  },
  {
    path: '/signin',
    element: withSuspense(<SignInScreen />),
  },
  {
    path: '/signup',
    element: withSuspense(<SignUpScreen />),
  },
  {
    path: '/',
    element: withProtectedShell(<MapPage />),
  },
  {
    path: '/map',
    element: withProtectedShell(<MapPage />),
  },
  {
    path: '/submit',
    element: withProtectedShell(<PriceSubmissionForm />),
  },
  {
    path: '/submissions',
    element: withProtectedShell(<PriceSubmissionHistory />),
  },
  {
    path: '/alerts',
    element: withProtectedShell(<AlertsListScreen />),
  },
  {
    path: '/alerts/create',
    element: withProtectedShell(<CreateAlertScreen />),
  },
  {
    path: '/alerts/edit/:alertId',
    element: withProtectedShell(<CreateAlertScreen />),
  },
  {
    path: '/alerts/:alertId',
    element: withProtectedShell(<AlertDetailsScreen />),
  },
  {
    path: '/notifications',
    element: withProtectedShell(<NotificationCenterScreen />),
  },
  {
    path: '/profile',
    element: withProtectedShell(<AccountScreen />),
  },
  {
    path: '/settings',
    element: withProtectedShell(<AccountScreen />),
  },
  {
    path: '/dashboard',
    element: withProtectedShell(<StationOwnerDashboardPage />),
  },
  {
    path: '/station-owner',
    element: withProtectedShell(<StationOwnerDashboardPage />),
  },
])
