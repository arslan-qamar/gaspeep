import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { DesktopNav } from './components/DesktopNav'
import { useAuth } from '../hooks/useAuth'

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <Header
        userName={user?.displayName || 'Guest'}
        userTier={user?.tier || 'free'}
        userMenuOpen={userMenuOpen}
        onUserMenuToggle={() => setUserMenuOpen(!userMenuOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <DesktopNav userTier={user?.tier || 'free'} currentPath={location.pathname} />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="pb-24 md:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <BottomNav userTier={user?.tier || 'free'} currentPath={location.pathname} />
      </div>
    </div>
  )
}
