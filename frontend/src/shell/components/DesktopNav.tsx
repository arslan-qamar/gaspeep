import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, AlertCircle, BarChart3, Settings } from 'lucide-react'

interface DesktopNavProps {
  userTier: 'free' | 'premium'
  currentPath: string
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ userTier, currentPath }) => {
  const links = [
    { label: 'Browse Map', href: '/map', icon: MapPin },
    { label: 'Submit Price', href: '/submit', icon: BarChart3 },
    { label: 'Alerts', href: '/alerts', icon: AlertCircle, premium: true },
    { label: 'Dashboard', href: '/dashboard', icon: Settings, ownerOnly: true },
  ]

  return (
    <aside className="p-4 h-full overflow-y-auto">
      <nav className="space-y-2">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Tier Info */}
      <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Current Tier
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white capitalize mt-1">
          {userTier}
        </p>
        {userTier === 'free' && (
          <button className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors">
            Upgrade to Premium
          </button>
        )}
      </div>
    </aside>
  )
}
