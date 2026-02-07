import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, Settings, User, Clock, Bell, Crown, Heart } from 'lucide-react'

interface UserMenuProps {
  tier: 'free' | 'premium'
  userName: string
  isAuthenticated: boolean
  onClose?: () => void
}

export const UserMenu: React.FC<UserMenuProps> = ({
  tier,
  userName,
  isAuthenticated,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = () => {
    logout()
    navigate('/signin')
    onClose?.()
  }

  if (!isAuthenticated) {
    return (
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-[9999]"
      >
        <div className="p-4 space-y-2">
          <button
            onClick={() => handleNavigation('/signin')}
            className="w-full px-4 py-2 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => handleNavigation('/signup')}
            className="w-full px-4 py-2 text-center text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg font-medium transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 z-[9999]"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <p className="font-semibold text-neutral-900 dark:text-neutral-50">
          {userName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {tier === 'premium' && <Crown size={14} className="text-yellow-500" />}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {tier === 'free' ? 'Free Account' : 'Premium Member'}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <button
          onClick={() => handleNavigation('/profile')}
          className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
        >
          <User size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => handleNavigation('/settings')}
          className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
        >
          <Settings size={18} />
          <span>Account Settings</span>
        </button>
        <button
          onClick={() => handleNavigation('/submissions')}
          className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
        >
          <Clock size={18} />
          <span>Submission History</span>
        </button>
        {tier === 'premium' && (
          <button
            onClick={() => handleNavigation('/alerts')}
            className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
          >
            <Bell size={18} />
            <span>Alerts</span>
          </button>
        )}
        <button
          onClick={() => handleNavigation('/favorites')}
          className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
        >
          <Heart size={18} />
          <span>Saved Stations</span>
        </button>
      </div>

      {/* Upgrade CTA for Free Users */}
      {tier === 'free' && (
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleNavigation('/upgrade')}
            className="w-full px-4 py-2.5 text-center bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all flex items-center justify-center gap-2"
          >
            <Crown size={18} />
            <span>Upgrade to Premium</span>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-3 font-medium transition-colors rounded-b-lg"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}
