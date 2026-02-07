import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, AlertCircle, BarChart3, Settings } from 'lucide-react'

interface BottomNavProps {
  userTier: 'free' | 'premium'
  currentPath: string
}

export const BottomNav: React.FC<BottomNavProps> = ({ userTier, currentPath }) => {
  const links = [
    { label: 'Map', href: '/map', icon: MapPin },
    { label: 'Alerts', href: '/alerts', icon: AlertCircle, premium: true },
    { label: 'Submit', href: '/submit', icon: BarChart3 },
    { label: 'Profile', href: '/profile', icon: Settings },
  ]

  return (
    <nav className="flex justify-around items-center h-20">
      {links.map((link) => {
        const isActive = currentPath.startsWith(link.href)
        const Icon = link.icon

        // Hide premium features if user is on free tier
        if (link.premium && userTier === 'free') {
          return null
        }

        return (
          <Link
            key={link.href}
            to={link.href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-950'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
