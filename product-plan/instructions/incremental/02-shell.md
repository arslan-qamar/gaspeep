# Phase 2: Application Shell & Navigation

**Duration:** 1-2 days  
**Goal:** Build the persistent app shell with navigation, user menu, and layout structure

---

## Overview

The shell is the persistent wrapper around all sections. It includes:
- Top header with branding
- Bottom navigation (mobile) / Sidebar (desktop)
- User menu / profile dropdown
- Core layout and routing structure

---

## Step 1: Shell React Components

### 1.1 AppShell Component

`src/shell/components/AppShell.tsx`:

```tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import DesktopNav from './DesktopNav';

interface AppShellProps {
  children: React.ReactNode;
  userTier?: 'free' | 'premium';
  userName?: string;
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  userTier = 'free',
  userName = 'Guest',
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <Header
        userName={userName}
        userTier={userTier}
        userMenuOpen={userMenuOpen}
        onUserMenuToggle={() => setUserMenuOpen(!userMenuOpen)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <DesktopNav userTier={userTier} currentPath={location.pathname} />
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
        <BottomNav userTier={userTier} currentPath={location.pathname} />
      </div>
    </div>
  );
};

export default AppShell;
```

### 1.2 Header Component

`src/shell/components/Header.tsx`:

```tsx
import React from 'react';
import UserMenu from './UserMenu';

interface HeaderProps {
  userName: string;
  userTier: 'free' | 'premium';
  userMenuOpen: boolean;
  onUserMenuToggle: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  userTier,
  userMenuOpen,
  onUserMenuToggle,
  onLogout,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
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
              onLogout={onLogout}
              onClose={() => onUserMenuToggle()}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### 1.3 Bottom Navigation (Mobile)

`src/shell/components/BottomNav.tsx`:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, AlertCircle, BarChart3, Settings } from 'lucide-react';

interface BottomNavProps {
  userTier: 'free' | 'premium';
  currentPath: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ userTier, currentPath }) => {
  const links = [
    { label: 'Map', href: '/map', icon: MapPin },
    { label: 'Alerts', href: '/alerts', icon: AlertCircle, premium: true },
    { label: 'Submit', href: '/submit', icon: BarChart3 },
    { label: 'Profile', href: '/profile', icon: Settings },
  ];

  return (
    <nav className="flex justify-around items-center h-20">
      {links.map((link) => {
        const isActive = currentPath.startsWith(link.href);
        const Icon = link.icon;

        // Hide premium features if user is on free tier
        if (link.premium && userTier === 'free') {
          return null;
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
        );
      })}
    </nav>
  );
};

export default BottomNav;
```

### 1.4 Desktop Navigation (Sidebar)

`src/shell/components/DesktopNav.tsx`:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, AlertCircle, BarChart3, Settings, CreditCard } from 'lucide-react';

interface DesktopNavProps {
  userTier: 'free' | 'premium';
  currentPath: string;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ userTier, currentPath }) => {
  const links = [
    { label: 'Browse Map', href: '/map', icon: MapPin },
    { label: 'Submit Price', href: '/submit', icon: BarChart3 },
    { label: 'Alerts', href: '/alerts', icon: AlertCircle, premium: true },
    { label: 'Dashboard', href: '/dashboard', icon: Settings, ownerOnly: true },
  ];

  return (
    <aside className="p-4 h-full overflow-y-auto">
      <nav className="space-y-2">
        {links.map((link) => {
          const isActive = currentPath.startsWith(link.href);
          const Icon = link.icon;

          // Hide premium features if user is on free tier
          if (link.premium && userTier === 'free') {
            return null;
          }

          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
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
          <button className="mt-3 w-full bg-lime-500 hover:bg-lime-600 text-white font-medium py-2 rounded-lg transition-colors">
            Upgrade to Premium
          </button>
        )}
      </div>
    </aside>
  );
};

export default DesktopNav;
```

### 1.5 User Menu Dropdown

`src/shell/components/UserMenu.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { LogOut, Settings, Heart } from 'lucide-react';

interface UserMenuProps {
  tier: 'free' | 'premium';
  userName: string;
  onLogout?: () => void;
  onClose?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  tier,
  userName,
  onLogout,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50"
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
          onClick={() => {
            onLogout?.();
            onClose?.();
          }}
          className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 font-medium transition-colors rounded-lg"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenu;
```

---

## Step 2: Routing Setup

### 2.1 Router Configuration

`src/lib/router.tsx`:

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../shell/components/AppShell';

// Import page components (created in following phases)
// import MapPage from '../sections/map-and-station-browsing/pages/MapPage';
// import SubmitPricePage from '../sections/price-submission-system/pages/SubmitPricePage';
// import AlertsPage from '../sections/alerts-and-notifications/pages/AlertsPage';
// import AuthPage from '../sections/user-authentication-and-tiers/pages/AuthPage';
// import DashboardPage from '../sections/station-owner-dashboard/pages/DashboardPage';

interface RouterProps {
  userTier?: 'free' | 'premium';
  userName?: string;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const AppRouter: React.FC<RouterProps> = ({
  userTier = 'free',
  userName = 'Guest',
  isAuthenticated = false,
  onLogout,
}) => {
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          {/* Auth routes will go here */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppShell
        userTier={userTier}
        userName={userName}
        onLogout={onLogout}
      >
        <Routes>
          {/* Map Page */}
          {/* <Route path="/map" element={<MapPage />} /> */}

          {/* Price Submission */}
          {/* <Route path="/submit" element={<SubmitPricePage />} /> */}

          {/* Alerts (Premium) */}
          {userTier === 'premium' && (
            <Route path="/alerts" element={/* <AlertsPage /> */ null} />
          )}

          {/* Dashboard (Owner) */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}

          {/* Profile / Settings */}
          {/* <Route path="/profile" element={<ProfilePage />} /> */}

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
};

export default AppRouter;
```

---

## Step 3: Update Main App

`src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './lib/router';
import './index.css';

// Mock user state (replace with real auth later)
const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  tier: 'premium' as const,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter
      userTier={mockUser.tier}
      userName={mockUser.name}
      isAuthenticated={true}
      onLogout={() => console.log('Logged out')}
    />
  </React.StrictMode>,
);
```

---

## Step 4: Styling

Ensure `src/index.css` includes Tailwind directives:

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  body {
    @apply bg-white dark:bg-slate-950 text-slate-900 dark:text-white;
  }
}
```

---

## Checklist for Phase 2

- [x] AppShell component created and responsive
- [x] Header with logo and user menu
- [x] Bottom navigation for mobile
- [x] Desktop sidebar navigation
- [x] User menu dropdown with logout
- [x] Router configured with all routes
- [x] Main.tsx updated to use AppRouter
- [x] Tailwind CSS working for all components
- [x] Dark mode variants tested
- [x] Responsive layout tested (mobile/tablet/desktop)
- [x] Premium-only routes gated by tier
- [x] User name displayed in header

**✅ Phase 2 Complete - Verified on February 7, 2026**

---

## Testing Shell

```bash
npm run dev

# Visit http://localhost:3000
# Should see:
# - Header with Gas Peep logo and user name
# - Bottom nav on mobile or sidebar on desktop
# - User menu dropdown when clicking avatar
# - Dark mode toggle working
```

---

## Next Phase

→ Continue to **Phase 3: Map & Station Browsing** once shell is complete.

The shell is now ready for content sections.
