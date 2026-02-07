import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, Settings, Heart } from 'lucide-react'

interface UserMenuProps {
  tier: 'free' | 'premium'
  userName: string
  onClose?: () => void
}

export const UserMenu: React.FC<UserMenuProps> = ({
  tier,
  userName,
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

  const handleLogout = () => {
    logout()
    navigate('/signin')
    onClose?.()
  }

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[9999]"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white">
          {userName}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {tier === 'free' ? 'Free Account' : 'Premium Member'}
        </p>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <button className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
          <Heart size={18} />
          <span>Saved Stations</span>
        </button>
        <button className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 font-medium transition-colors rounded-lg"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}
