import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Upload, Bell, LayoutDashboard, Crown } from 'lucide-react'

interface NavigationProps {
  userTier: 'free' | 'premium'
  currentPath: string
  isAuthenticated: boolean
  isStationOwner?: boolean
}

/**
 * Desktop Navigation Component
 * Displays vertical navigation sidebar for tablet/desktop screens (≥768px)
 * Shows tier-specific navigation items and upgrade prompt for free users
 */
export const Navigation: React.FC<NavigationProps> = ({
  userTier,
  currentPath,
  isAuthenticated,
  isStationOwner = false,
}) => {
  const links = [
    { label: 'Browse Map', href: '/map', icon: MapPin, show: true, description: 'Find nearby gas stations' },
    { label: 'Submit Price', href: '/submit', icon: Upload, show: isAuthenticated, description: 'Update fuel prices' },
    { label: 'Alerts', href: '/alerts', icon: Bell, show: isAuthenticated && userTier === 'premium', description: 'Price notifications', premium: true },
    { label: 'Station Dashboard', href: '/dashboard', icon: LayoutDashboard, show: isStationOwner, description: 'Manage your station' },
  ]

  return (
    <aside className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.filter(link => link.show).map((link) => {
          const isActive = currentPath.startsWith(link.href) || (link.href === '/map' && currentPath === '/')
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg font-medium transition-all group ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon size={20} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{link.label}</div>
                <div className={`text-xs mt-0.5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-500'
                }`}>
                  {link.description}
                </div>
              </div>
            </Link>
          )
        })}

        {/* Upgrade CTA for alerts if free user */}
        {userTier === 'free' && isAuthenticated && (
          <Link
            to="/upgrade"
            className="flex items-start gap-3 px-4 py-3 rounded-lg font-medium transition-all border-2 border-dashed border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          >
            <Bell size={20} className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-green-700 dark:text-green-300">Price Alerts</div>
              <div className="text-xs mt-0.5 text-green-600 dark:text-green-400">
                Unlock with Premium
              </div>
            </div>
          </Link>
        )}
      </nav>

      {/* Tier Info Card */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Current Plan
            </p>
            {userTier === 'premium' && (
              <Crown size={16} className="text-yellow-500" />
            )}
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 capitalize">
            {userTier}
          </p>
          {userTier === 'free' && (
            <>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                Upgrade for ad-free maps and custom price alerts
              </p>
              <Link
                to="/upgrade"
                className="mt-3 w-full block text-center bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-2.5 rounded-lg transition-all"
              >
                Upgrade to Premium
              </Link>
            </>
          )}
          {userTier === 'premium' && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
              Enjoying all premium features
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
