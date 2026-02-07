# Shell Quick Reference Card

## 🚀 Usage

### Wrap Your Page Content
```tsx
import { AppShell } from './shell/AppShell'

function MyApp() {
  return (
    <AppShell>
      <YourPageContent />
    </AppShell>
  )
}
```

---

## 📦 Component Imports

```tsx
// Main layout
import { AppShell } from './shell/AppShell'

// Individual components (rarely needed directly)
import { Header } from './shell/components/Header'
import { Navigation } from './shell/components/Navigation'
import { BottomNav } from './shell/components/BottomNav'
import { UserMenu } from './shell/components/UserMenu'
```

---

## 🔑 Key Props

### AppShell
```tsx
interface AppShellProps {
  children: React.ReactNode  // Your page content
}
```

### Header
```tsx
interface HeaderProps {
  userName?: string           // User's display name
  userTier: 'free' | 'premium'
  userMenuOpen: boolean
  onUserMenuToggle: () => void
  isAuthenticated: boolean
  currentPath: string         // From useLocation()
  isStationOwner?: boolean
}
```

### Navigation (Desktop Sidebar)
```tsx
interface NavigationProps {
  userTier: 'free' | 'premium'
  currentPath: string
  isAuthenticated: boolean
  isStationOwner?: boolean
}
```

### BottomNav (Mobile)
```tsx
interface BottomNavProps {
  userTier: 'free' | 'premium'
  currentPath: string
  isAuthenticated: boolean
}
```

### UserMenu
```tsx
interface UserMenuProps {
  tier: 'free' | 'premium'
  userName: string
  isAuthenticated: boolean
  onClose?: () => void
}
```

---

## 🎨 Styling Reference

### Breakpoints
```tsx
sm: '640px'   // Small devices
md: '768px'   // Tablets (navigation switches here)
lg: '1024px'  // Desktop (sidebar widens)
xl: '1280px'  // Large desktop
```

### Shell Dimensions
```tsx
Header Height: 64px (h-16)
Sidebar Width: 256px (md:w-64) / 288px (lg:w-72)
Bottom Nav Height: 64px (h-16)
```

### Color Tokens
```tsx
// Backgrounds
Light: bg-neutral-50
Dark:  dark:bg-neutral-900

// Text
Light: text-neutral-900
Dark:  dark:text-neutral-50

// Borders
Light: border-neutral-200
Dark:  dark:border-neutral-800

// Active/Primary
Active: text-blue-600 dark:text-blue-400
        bg-blue-100 dark:bg-blue-950

// Secondary/Upgrade
Upgrade: text-green-600 dark:text-green-400
         from-blue-600 to-green-600 (gradient)
```

---

## 🔗 Navigation Routes

```tsx
// Core routes
/                  → Home (Map)
/map              → Map view
/submit           → Price submission (auth required)
/alerts           → Alerts (premium only)
/profile          → User profile (auth required)

// Auth routes
/signin           → Sign in page
/signup           → Sign up page

// Premium routes
/upgrade          → Upgrade to premium

// Station owner routes
/dashboard        → Station dashboard (station owner only)

// Settings routes
/settings         → Account settings (auth required)
/submissions      → Submission history (auth required)
/favorites        → Saved stations (auth required)
```

---

## 🎯 User States

### Not Authenticated
```tsx
isAuthenticated: false
- Header: Shows "Log In" and "Sign Up" buttons
- BottomNav: Map, (locked Submit), Profile→/signin
- Navigation: Map only
- UserMenu: Log In / Sign Up options
```

### Free Tier
```tsx
isAuthenticated: true
userTier: 'free'
- Header: User avatar + name
- BottomNav: Map, Submit, Profile, Upgrade
- Navigation: Map, Submit, (locked Alerts)
- UserMenu: Profile links + Upgrade CTA
```

### Premium Tier
```tsx
isAuthenticated: true
userTier: 'premium'
- Header: User avatar + name
- BottomNav: Map, Submit, Alerts, Profile
- Navigation: Map, Submit, Alerts
- UserMenu: Profile links + Crown badge
```

### Station Owner
```tsx
isAuthenticated: true
userTier: 'premium'
isStationOwner: true
- All Premium features PLUS:
- Header: + Dashboard link
- Navigation: + Dashboard link
- Access to station management
```

---

## 🪝 Required Hooks

```tsx
import { useAuth } from './hooks/useAuth'
import { useLocation } from 'react-router-dom'

// Inside component
const { user, loading, error, login, logout } = useAuth()
const location = useLocation()

// User object structure
user: {
  id: string
  email: string
  displayName: string
  tier: 'free' | 'premium'
  isStationOwner?: boolean
  createdAt: string
}
```

---

## 🔧 Common Tasks

### Add a New Navigation Item
```tsx
// 1. Add to Header (desktop nav)
const navItems = [
  // ...existing items
  { 
    label: 'New Feature', 
    href: '/new-feature', 
    icon: NewIcon, 
    show: yourCondition 
  },
]

// 2. Add to Navigation (sidebar)
const links = [
  // ...existing items
  { 
    label: 'New Feature',
    href: '/new-feature',
    icon: NewIcon,
    show: yourCondition,
    description: 'Feature description'
  },
]

// 3. Add to BottomNav (mobile)
const links = [
  // ...existing items
  { 
    label: 'New',
    href: '/new-feature',
    icon: NewIcon,
    show: yourCondition
  },
]
```

### Change Active State Colors
```tsx
// Find this pattern in any nav component:
isActive
  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950'
  : 'text-neutral-700 dark:text-neutral-300'

// Replace blue-600 with your color
```

### Add a User Menu Item
```tsx
// In UserMenu.tsx, add to menu items section:
<button
  onClick={() => handleNavigation('/your-route')}
  className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
>
  <YourIcon size={18} />
  <span>Your Feature</span>
</button>
```

### Conditional Navigation by Tier
```tsx
// Show only for premium
show: isAuthenticated && userTier === 'premium'

// Show only for free (upgrade prompts)
show: isAuthenticated && userTier === 'free'

// Show only for station owners
show: isStationOwner

// Show for all authenticated
show: isAuthenticated

// Show for everyone
show: true
```

---

## 🐛 Debugging Tips

### User Menu Won't Close
```tsx
// Check click-outside handler in UserMenu.tsx
// Ensure menuRef is properly attached
ref={menuRef}
```

### Active State Not Updating
```tsx
// Verify currentPath is being passed correctly
// Check useLocation() is called in AppShell
const location = useLocation()
currentPath={location.pathname}
```

### Navigation Not Visible
```tsx
// Check responsive classes
// Mobile (<768px): BottomNav visible, Navigation hidden
// Desktop (≥768px): Navigation visible, BottomNav hidden
```

### Dark Mode Not Working
```tsx
// Ensure Tailwind dark mode is configured
// tailwind.config.js should have:
darkMode: 'class'

// Parent element should have 'dark' class when enabled
```

### Tier Features Not Showing
```tsx
// Verify user object has tier field
console.log(user?.tier)

// Check conditional rendering logic
show: userTier === 'premium'
```

---

## 📝 Code Snippets

### Get Current User Info
```tsx
const { user } = useAuth()
const userTier = user?.tier || 'free'
const isAuthenticated = !!user
const userName = user?.displayName || user?.email || 'User'
```

### Check if Route is Active
```tsx
const { pathname } = useLocation()
const isActive = pathname.startsWith('/your-route')
// or for exact match:
const isActive = pathname === '/your-route'
```

### Navigate Programmatically
```tsx
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/target-route')
```

### Logout User
```tsx
const { logout } = useAuth()
const navigate = useNavigate()

const handleLogout = () => {
  logout()  // Clears localStorage
  navigate('/signin')
}
```

---

## 🎭 Icons Used

```tsx
import {
  MapPin,        // Map/Location
  Upload,        // Submit/Upload (was PlusCircle)
  Bell,          // Alerts/Notifications
  User,          // Profile/Account
  LayoutDashboard, // Dashboard
  Settings,      // Settings
  Clock,         // History
  Heart,         // Favorites
  Crown,         // Premium badge
  LogOut,        // Sign out
} from 'lucide-react'
```

---

## 🔍 Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter to activate links/buttons
- Escape to close user menu

### ARIA Labels
```tsx
aria-label="User menu"
aria-label="Navigate to map"
```

### Screen Reader Text
```tsx
<span className="sr-only">Additional context</span>
```

---

## 🚨 Common Errors

### "Cannot read property 'tier' of null"
```tsx
// ❌ Bad
user.tier

// ✅ Good
user?.tier || 'free'
```

### "useAuth is not defined"
```tsx
// Make sure to import
import { useAuth } from '../hooks/useAuth'
```

### "Link is not defined"
```tsx
// Make sure to import
import { Link } from 'react-router-dom'
```

---

## 📚 Related Documentation

- [README.md](./README.md) - Full component documentation
- [TESTS.md](./TESTS.md) - Test scenarios and checklist
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Visual diagrams and flow

---

**Version**: 1.0.0  
**Last Updated**: February 7, 2026  
**Status**: ✅ Production Ready
