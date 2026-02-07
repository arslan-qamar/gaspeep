# Application Shell — Component Structure

The application shell provides persistent navigation and layout across all Gas Peep screens.

---

## Shell Components

### 1. AppShell.tsx
Main container that wraps all screens with navigation and header.

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode;
  userTier?: 'free' | 'premium';
  isAuthenticated?: boolean;
  currentPath?: string;
}
```

**Features:**
- Fixed header at top (sticky on scroll)
- Bottom navigation on mobile (< 768px)
- Desktop navigation on larger screens
- Responsive layout
- User menu integration

### 2. Header.tsx
Top navigation bar with branding and user menu.

**Props:**
```typescript
interface HeaderProps {
  logoText?: string;
  onMenuClick?: () => void;
  userTier?: 'free' | 'premium';
  isAuthenticated?: boolean;
}
```

**Features:**
- "Gas Peep" branding/logo
- Desktop navigation links (hidden on mobile)
- User menu dropdown
- Logo clickable (returns to home)

### 3. UserMenu.tsx
Dropdown menu for authenticated user actions.

**Props:**
```typescript
interface UserMenuProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}
```

**Features:**
- User avatar or initials
- Profile link
- Settings link
- Submission history link
- Alerts link (if Premium or visible for redirect)
- "Upgrade to Premium" (if Free)
- Logout button

### 4. BottomNav.tsx
Mobile navigation (< 768px only).

**Props:**
```typescript
interface BottomNavProps {
  currentPath: string;
  isAuthenticated: boolean;
  userTier?: 'free' | 'premium';
}
```

**Features:**
- Fixed at bottom of screen
- 3-4 navigation items (Map, Submit, Alerts, More)
- Active indicator for current page
- Icon badges for notifications (optional)
- Touch-friendly spacing

### 5. DesktopNav.tsx
Horizontal navigation for larger screens (≥ 768px).

**Props:**
```typescript
interface DesktopNavProps {
  currentPath: string;
  isAuthenticated: boolean;
  userTier?: 'free' | 'premium';
}
```

**Features:**
- Horizontal menu links
- Hidden on mobile
- Shows only authenticated user routes
- Responsive menu items

---

## Layout Structure

### Mobile Layout (< 768px)
```
┌─────────────────────────────┐
│  Header (64px)              │  Fixed
│  [Logo]        [UserMenu]   │
├─────────────────────────────┤
│                             │
│                             │
│  Main Content (flex fill)   │  Scrollable
│                             │
│                             │
├─────────────────────────────┤
│  Bottom Navigation (64px)   │  Fixed
│  [Map][Submit][Alerts][More]│
└─────────────────────────────┘
```

### Desktop Layout (≥ 768px)
```
┌──────────────────────────────────────────────────────────┐
│  Header                                                   │  Fixed
│  [Logo]  [Map][Submit][Alerts]  [UserMenu]              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│                                                           │
│  Main Content                                            │
│                                                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Navigation Routes

### Mobile (Bottom Nav)
1. **Map** — `/` — Primary entry point
2. **Submit** — `/submit` — Price submission (auth required)
3. **Alerts** — `/alerts` — Price alerts (Premium only)
4. **More** — Menu for Profile, Settings, etc.

### Desktop (Horizontal Nav)
- **Home/Map** — `/`
- **Submit** — `/submit` (auth required)
- **Alerts** — `/alerts` (Premium only)
- **Help/About** (optional)
- **User Menu** — Profile, Settings, Logout

---

## Styling (Tailwind CSS v4)

```css
/* Shell container */
.app-shell {
  @apply flex flex-col min-h-screen;
}

/* Header */
.header {
  @apply fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900;
  @apply border-b border-slate-200 dark:border-slate-700;
  @apply flex items-center justify-between px-4 md:px-6;
  @apply z-30; /* Above content but below modals */
}

/* Main content area */
.main-content {
  @apply flex-1 mt-16 mb-16 md:mb-0; /* Offset for fixed header/nav */
  @apply overflow-y-auto;
}

/* Bottom navigation (mobile only) */
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 h-16 md:hidden;
  @apply bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700;
  @apply flex items-center justify-around;
  @apply z-30;
}

.nav-item {
  @apply flex flex-col items-center justify-center h-full flex-1;
  @apply text-xs text-slate-600 dark:text-slate-400;
  @apply cursor-pointer transition-colors;
}

.nav-item.active {
  @apply text-blue-600 dark:text-blue-400;
  @apply after:content-[''] after:absolute after:top-0 after:w-full after:h-1 after:bg-blue-600;
}

/* Desktop navigation (hidden on mobile) */
.desktop-nav {
  @apply hidden md:flex items-center gap-6;
  @apply flex-1 ml-8;
}

.nav-link {
  @apply text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400;
  @apply transition-colors;
}

/* User menu */
.user-menu-button {
  @apply flex items-center gap-2 p-2 rounded-lg;
  @apply hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors;
}

.user-menu-dropdown {
  @apply absolute top-full right-0 mt-2 w-48;
  @apply bg-white dark:bg-slate-800 rounded-lg shadow-lg;
  @apply z-40; /* Above other elements */
}

.menu-item {
  @apply block w-full text-left px-4 py-2;
  @apply text-slate-700 dark:text-slate-300;
  @apply hover:bg-slate-100 dark:hover:bg-slate-700;
  @apply transition-colors;
}
```

---

## Integration Checklist

- [ ] Header displays on all pages
- [ ] Logo clickable returns to map
- [ ] Bottom nav visible only on mobile
- [ ] Desktop nav visible on screens ≥ 768px
- [ ] User menu shows for authenticated users
- [ ] Logout works correctly
- [ ] Navigation links go to correct routes
- [ ] Active link highlighted
- [ ] Authentication state reflected in nav
- [ ] Premium gating applied (Alerts hidden for Free users)
- [ ] Responsive layout works
- [ ] Dark mode fully functional
- [ ] Fixed header doesn't overlap content
- [ ] Fixed nav doesn't overlap content
- [ ] Main content scrollable
- [ ] Touch targets adequate (min 44x44px on mobile)

---

## See Also
- Specification: [../../shell/spec.md](../../shell/spec.md)
- Example Implementation: Reference component files in src/shell/
