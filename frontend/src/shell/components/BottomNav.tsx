import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, PlusCircle, Bell, User } from 'lucide-react'

interface BottomNavProps {
  userTier: 'free' | 'premium'
  currentPath: string
  isAuthenticated: boolean
}

export const BottomNav: React.FC<BottomNavProps> = ({ userTier, currentPath, isAuthenticated }) => {
  const links = [
    { label: 'Map', href: '/map', icon: MapPin, show: true },
    { label: 'Submit', href: '/submit', icon: PlusCircle, show: isAuthenticated, authRequired: true },
    { label: 'Alerts', href: '/alerts', icon: Bell, show: isAuthenticated && userTier === 'premium', premium: true },
    { label: 'Profile', href: isAuthenticated ? '/profile' : '/signin', icon: User, show: true },
  ]

  return (
    <nav className="flex justify-around items-center h-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      {links.filter(link => link.show).map((link) => {
        const isActive = currentPath.startsWith(link.href) || (link.href === '/map' && currentPath === '/')
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            to={link.href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[4rem] transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
            aria-label={link.label}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-xs ${
              isActive ? 'font-semibold' : 'font-medium'
            }`}>
              {link.label}
            </span>
          </Link>
        )
      })}
      
      {/* Show upgrade indicator for free users */}
      {userTier === 'free' && (
        <Link
          to="/upgrade"
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[4rem] text-green-600 dark:text-green-400"
          aria-label="Upgrade to Premium"
        >
          <div className="relative">
            <Bell size={24} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <span className="text-xs font-medium">Upgrade</span>
        </Link>
      )}
    </nav>
  )
}
