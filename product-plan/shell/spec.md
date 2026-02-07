# Application Shell Specification

The Gas Peep application shell provides persistent navigation and layout structure across all screens.

---

## Design Philosophy

**Mobile-First Navigation** — Gas Peep is primarily used on-the-go, so the shell prioritizes mobile ergonomics with bottom tab navigation for easy thumb access.

**Context-Aware UI** — The shell adapts based on user tier (Free/Premium) and authentication state, showing relevant navigation options and calls-to-action.

**Map-Centric Design** — The map is the primary interface, so the shell provides minimal chrome to maximize screen real estate for the map view.

---

## Layout Structure

### Mobile Layout (< 768px)
```
┌─────────────────────────────┐
│  Header                     │
│  [Logo]        [User Menu]  │
├─────────────────────────────┤
│                             │
│                             │
│     Main Content Area       │
│                             │
│                             │
├─────────────────────────────┤
│  Bottom Navigation          │
│  [Map] [Submit] [More]      │
└─────────────────────────────┘
```

### Tablet/Desktop Layout (≥ 768px)
```
┌──────────────────────────────────────┐
│  Header                              │
│  [Logo]  [Nav Links]    [User Menu]  │
├──────────────────────────────────────┤
│                                      │
│                                      │
│        Main Content Area             │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

---

## Components

### 1. Header

**Purpose:** Branding, user account access, and desktop navigation

**Elements:**
- **Logo/Brand** — "Gas Peep" with icon (fuel pump or gas droplet)
- **Desktop Navigation** (≥768px only) — Horizontal nav links
- **User Menu** — Avatar/icon that opens dropdown menu

**User Menu Options:**
- **Authenticated Users:**
  - Profile
  - Account Settings
  - Submission History
  - Alerts (Premium only)
  - Upgrade to Premium (Free users only)
  - Log Out
- **Unauthenticated Users:**
  - Log In
  - Sign Up

**Styling:**
- Fixed at top, sticky on scroll
- Background: neutral-50 (light mode), neutral-900 (dark mode)
- Border bottom: neutral-200/800
- Height: 64px
- Padding: 16px horizontal

---

### 2. Bottom Navigation (Mobile)

**Purpose:** Primary navigation for mobile users

**Visible:** Only on screens < 768px

**Navigation Items:**

1. **Map** (default/home)
   - Icon: Map pin or location marker
   - Route: `/`
   - Always visible

2. **Submit Price**
   - Icon: Plus circle or upload
   - Route: `/submit`
   - Requires authentication
   - Shows login prompt if not authenticated

3. **Alerts** (Premium only)
   - Icon: Bell
   - Route: `/alerts`
   - Visible only to Premium users
   - Shows upgrade CTA for Free users

4. **Profile**
   - Icon: User circle
   - Route: `/profile` (authenticated) or `/login` (unauthenticated)
   - Always visible

**Styling:**
- Fixed at bottom
- Background: neutral-50 (light mode), neutral-900 (dark mode)
- Border top: neutral-200/800
- Height: 64px
- Active state: primary-600 color + bold icon
- Inactive state: neutral-600 color

---

### 3. Desktop Navigation

**Purpose:** Horizontal navigation for tablet/desktop users

**Visible:** Only on screens ≥ 768px

**Navigation Items:**
- Map (always visible)
- Submit Price (authenticated users)
- Alerts (Premium users)
- Station Owner (verified station owners)

**Styling:**
- Inline with header
- Centered between logo and user menu
- Active state: primary-600 color + underline
- Hover state: neutral-700 background

---

### 4. Upgrade Banner (Free Users)

**Purpose:** Encourage free users to upgrade to Premium

**Visibility:**
- Show on non-map screens for Free users
- Dismissible (but persists across sessions until upgraded)
- Don't show if dismissed in last 24 hours

**Content:**
- "Upgrade to Premium for ad-free maps and custom price alerts"
- CTA button: "Upgrade Now"
- Dismiss button (X)

**Styling:**
- Background: gradient from primary-600 to secondary-600
- Text: white
- Positioned below header, above content
- Height: 56px (mobile), 48px (desktop)

---

### 5. Ad Container (Free Users on Map)

**Purpose:** Display ads before enabling map scrolling

**Behavior:**
- Show interstitial or banner ad when Free user opens map
- "Continue to Map" button appears after ad view/timeout
- Map becomes interactive after dismissal

---

## Responsive Breakpoints

- **Mobile:** < 768px → Bottom navigation
- **Tablet:** 768px - 1023px → Desktop nav, compact spacing
- **Desktop:** ≥ 1024px → Desktop nav, comfortable spacing

---

## User Tier Variations

### Free Users
- See bottom nav: Map, Submit, Profile
- See upgrade banner on most screens
- Map view shows ad container before scrolling
- "Alerts" nav item shows upgrade tooltip

### Premium Users
- See bottom nav: Map, Submit, Alerts, Profile
- No upgrade banner
- No ads on map
- Full access to all navigation items

### Station Owners (Premium + Verified)
- Additional nav item: "Station Dashboard"
- Access to broadcast management

---

## Dark Mode Behavior

All shell components must support dark mode:
- **Header/Nav backgrounds:** neutral-50 → neutral-900
- **Text:** neutral-900 → neutral-50
- **Borders:** neutral-200 → neutral-800
- **Active states:** primary-600 (same in both modes)
- **Hover states:** neutral-100 → neutral-800

---

## Navigation State Management

- Active route should be visually indicated
- Navigation should be accessible via keyboard (tab navigation)
- Screen reader friendly with proper ARIA labels
- Smooth transitions between routes (no page reload)

---

## Implementation Notes

- Use React Native Navigation for mobile apps
- Use React Router for web
- Shell should be persistent (doesn't unmount on route change)
- User menu should close on outside click
- Bottom nav should not obscure content (add padding to main content area)
- Header should cast subtle shadow when scrolled past 0
