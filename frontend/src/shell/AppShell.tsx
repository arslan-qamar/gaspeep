import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { Navigation } from './components/Navigation'
import { useAuth } from '../hooks/useAuth'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * Application Shell Component
 * Provides persistent navigation and layout structure across all screens
 * 
 * Layout:
 * - Mobile (<768px): Fixed header + bottom navigation
 * - Desktop (≥768px): Fixed header + sidebar navigation
 * 
 * Features:
 * - Responsive breakpoints at 768px (tablet) and 1024px (desktop)
 * - User tier-based navigation visibility
 * - Dark mode support
 * - Sticky header with shadow on scroll
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAuthenticated = !!user
  const userTier = user?.tier || 'free'
  const userName = user?.displayName || user?.email || 'User'
  const isStationOwner = user?.isStationOwner || false

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
      {/* Header - Fixed at top */}
      <Header
        userName={userName}
        userTier={userTier}
        userMenuOpen={userMenuOpen}
        onUserMenuToggle={() => setUserMenuOpen(!userMenuOpen)}
        isAuthenticated={isAuthenticated}
        currentPath={location.pathname}
        isStationOwner={isStationOwner}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation - Hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72">
          <Navigation
            userTier={userTier}
            currentPath={location.pathname}
            isAuthenticated={isAuthenticated}
            isStationOwner={isStationOwner}
          />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {/* Add padding bottom on mobile for bottom nav, remove on desktop */}
          <div className="h-full overflow-auto pb-16 md:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40">
        <BottomNav
          userTier={userTier}
          currentPath={location.pathname}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}
