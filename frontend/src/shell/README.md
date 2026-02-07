# Gas Peep - Shell Implementation (Section 2)

## Overview

The Application Shell provides persistent navigation and layout structure across all screens of Gas Peep. It adapts responsively across mobile, tablet, and desktop breakpoints with user tier-based features.

## Components Implemented

### 1. **AppShell.tsx** - Main Layout Container
- **Purpose**: Root layout component that wraps all application content
- **Features**:
  - Responsive layout switching at 768px breakpoint
  - User authentication state management
  - Tier-based navigation visibility
  - Dark mode support throughout

### 2. **Header.tsx** - Top Navigation Bar
- **Purpose**: Branding, desktop navigation, and user account access
- **Layout**:
  - **Mobile (<768px)**: Logo + User Menu (simplified)
  - **Desktop (≥768px)**: Logo + Horizontal Nav Links + User Menu
- **Features**:
  - Sticky positioning with 64px height
  - Integrated desktop navigation (Map, Submit, Alerts, Dashboard)
  - User authentication buttons for non-authenticated users
  - Gradient brand logo with fuel icon
  - Active route highlighting with blue accent color

### 3. **Navigation.tsx** - Desktop Sidebar
- **Purpose**: Vertical navigation for tablet/desktop screens
- **Visibility**: Only visible on screens ≥768px
- **Width**: 256px (md), 288px (lg)
- **Features**:
  - Descriptive navigation items with icons and subtitles
  - Tier-based item visibility (Premium only for Alerts)
  - Upgrade CTA for free users to unlock Alerts
  - Current plan info card at bottom with upgrade button
  - Station Owner dashboard link when applicable

### 4. **BottomNav.tsx** - Mobile Navigation
- **Purpose**: Primary navigation for mobile users
- **Visibility**: Only visible on screens <768px
- **Height**: 64px, fixed at bottom
- **Navigation Items**:
  - **Map**: Home/default view (always visible)
  - **Submit**: Price submission (authenticated users only)
  - **Alerts**: Price notifications (Premium users only)
  - **Profile**: User account (redirects to sign-in if not authenticated)
  - **Upgrade**: Premium promotion indicator (free users only)
- **Features**:
  - Active state with blue accent and bold icons
  - Auth-required prompts for unauthenticated users
  - Upgrade indicator with notification badge

### 5. **UserMenu.tsx** - Account Dropdown
- **Purpose**: User account management and navigation
- **Features**:
  - Profile and account settings access
  - Submission history link
  - Premium-only alerts link
  - Saved stations/favorites
  - Tier badge (Crown icon for Premium)
  - Upgrade CTA for free users (gradient button)
  - Logout functionality
  - Click-outside-to-close behavior
  - Non-authenticated state with Log In / Sign Up buttons

## Design System Integration

### Colors (Design Tokens)
- **Primary**: Blue (#2563eb) - Navigation highlights, CTAs
- **Secondary**: Green (#16a34a) - Upgrade prompts, success states
- **Neutral**: Slate shades - Backgrounds and text
  - Light mode: neutral-50 backgrounds, neutral-900 text
  - Dark mode: neutral-900 backgrounds, neutral-50 text
  - Borders: neutral-200 (light), neutral-800 (dark)

### Typography
- **Font Family**: Inter (heading and body)
- **Font Weights**: 
  - Regular (400) - Body text
  - Medium (500) - Navigation items
  - Semibold (600) - Active states
  - Bold (700) - Headers, emphasis

### Spacing & Layout
- **Header Height**: 64px (fixed)
- **Bottom Nav Height**: 64px (fixed)
- **Desktop Sidebar Width**: 256px (md), 288px (lg)
- **Content Padding**: Mobile has 64px bottom padding for bottom nav
- **Border Widths**: 1px default, 2px for dashed upgrade CTAs

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Fixed header + bottom navigation |
| Tablet | 768px - 1023px | Fixed header + sidebar (256px) |
| Desktop | ≥ 1024px | Fixed header + sidebar (288px) |

## User Tier Variations

### Free Users
- **Visible Nav Items**: Map, Submit (auth), Profile
- **Bottom Nav**: Map, Submit, Profile, Upgrade indicator
- **Features**: 
  - "Upgrade to Premium" in sidebar
  - Upgrade button in user menu
  - Alerts shown as locked with upgrade prompt

### Premium Users
- **Visible Nav Items**: Map, Submit, Alerts, Profile
- **Bottom Nav**: Map, Submit, Alerts, Profile
- **Features**:
  - Crown badge in user menu
  - Full access to Alerts
  - "Enjoying all premium features" message
  - No upgrade prompts

### Station Owners (Premium + Verified)
- **Additional Nav Item**: Station Dashboard
- **Features**: Access to broadcast management and analytics

## Dark Mode Support

All components fully support dark mode with proper color token switching:

```css
/* Light Mode */
bg-neutral-50, text-neutral-900, border-neutral-200

/* Dark Mode */
dark:bg-neutral-900, dark:text-neutral-50, dark:border-neutral-800
```

Active states use the same blue accent in both modes for consistency.

## Accessibility Features

- **ARIA Labels**: All navigation items have proper labels
- **Keyboard Navigation**: Full tab navigation support
- **Focus States**: Visible focus indicators on interactive elements
- **Screen Reader Friendly**: Semantic HTML structure
- **Click Outside**: User menu closes when clicking outside

## State Management

### Authentication State
- Managed via `useAuth` hook
- Token stored in localStorage as `auth_token`
- User object includes: id, email, displayName, tier, isStationOwner

### Navigation State
- Active route tracked via `useLocation` from react-router
- User menu open/close state managed locally in AppShell
- Click-outside handler in UserMenu component

## Integration Points

### Required Hooks
- `useAuth()` - Authentication state and methods
- `useLocation()` - Current route tracking from react-router

### Required Services
- `authService` - signin, signup, getCurrentUser, logout
- User interface with tier and isStationOwner fields

### Router Integration
- All navigation uses react-router's `Link` component
- Routes: `/`, `/map`, `/submit`, `/alerts`, `/dashboard`, `/profile`, `/signin`, `/signup`, `/upgrade`

## Testing Checklist

- [x] Mobile navigation displays correctly (<768px)
- [x] Desktop navigation displays correctly (≥768px)
- [x] Header shows desktop nav on larger screens
- [x] Bottom nav hidden on desktop
- [x] Sidebar hidden on mobile
- [x] Active route highlighting works
- [x] User menu opens/closes properly
- [x] Click outside closes user menu
- [x] Dark mode works across all components
- [x] Tier-based visibility (Alerts for Premium only)
- [x] Upgrade CTAs show for free users
- [x] Authentication states handled (logged in vs out)
- [x] Station owner dashboard link shows when applicable
- [x] TypeScript types are strict and correct
- [x] No console errors or warnings

## Next Steps

With the Shell implementation complete, the foundation is ready for:
1. **Section 3**: Map & Station Browsing - Main map interface
2. **Section 4**: Price Submission System - User engagement
3. **Section 5**: User Authentication & Tiers - Full auth flows
4. **Section 6**: Alerts & Notifications - Premium features
5. **Section 7**: Station Owner Dashboard - Business features

## File Structure

```
frontend/src/shell/
├── AppShell.tsx              # Main layout container
└── components/
    ├── Header.tsx            # Top navigation with branding
    ├── Navigation.tsx        # Desktop sidebar navigation
    ├── BottomNav.tsx         # Mobile bottom navigation
    └── UserMenu.tsx          # Account dropdown menu
```

## Notes

- The old `DesktopNav.tsx` has been replaced by the new `Navigation.tsx` component with improved design
- All components use Tailwind CSS v4 for styling
- Components are fully typed with TypeScript strict mode
- Props-based architecture ensures testability
- No global state dependencies outside of auth hook
