import React from 'react'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  userName: string
  userTier: 'free' | 'premium'
  userMenuOpen: boolean
  onUserMenuToggle: () => void
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  userTier,
  userMenuOpen,
  onUserMenuToggle,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
      <div className="flex items-center justify-between max-w-6x2 mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white">GP</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Gas Peep
          </h1>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={onUserMenuToggle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userName[0].toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-900 dark:text-white">
              {userName}
            </span>
          </button>

          {userMenuOpen && (
            <UserMenu
              tier={userTier}
              userName={userName}
              onClose={onUserMenuToggle}
            />
          )}
        </div>
      </div>
    </header>
  )
}
