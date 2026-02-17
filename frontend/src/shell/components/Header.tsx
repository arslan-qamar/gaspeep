import React from 'react'
import { Link } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import { MapPin, Upload, Bell, LayoutDashboard, List } from 'lucide-react'

interface HeaderProps {
  userName?: string
  userTier: 'free' | 'premium'
  userMenuOpen: boolean
  onUserMenuToggle: () => void
  isAuthenticated: boolean
  currentPath: string
  isStationOwner?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  userTier,
  userMenuOpen,
  onUserMenuToggle,
  isAuthenticated,
  currentPath,
  isStationOwner = false,
}) => {
  // Desktop navigation items
  const navItems = [
    { label: 'Map', href: '/map', icon: MapPin, show: true },
    { label: 'Submit Price', href: '/submit', icon: Upload, show: isAuthenticated },
    { label: 'Submissions', href: '/submissions', icon: List, show: isAuthenticated },
    { label: 'Alerts', href: '/alerts', icon: Bell, show: isAuthenticated && userTier === 'premium' },
    { label: 'Station Dashboard', href: '/dashboard', icon: LayoutDashboard, show: isStationOwner },
  ]

  return (
    <header className="sticky top-0 z-50 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 h-16">
      <div className="flex items-center justify-between h-full px-4 max-w-8xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">         
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            ⛽ Gas Peep
          </h1>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon
            const isActive = currentPath.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="relative">
          {isAuthenticated ? (
            <>
              <button
                onClick={onUserMenuToggle}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {userName ? userName[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {userName || 'User'}
                </span>
              </button>

              {userMenuOpen && (
                <UserMenu
                  tier={userTier}
                  userName={userName || 'User'}
                  isAuthenticated={isAuthenticated}
                  onClose={onUserMenuToggle}
                />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/signin"
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
