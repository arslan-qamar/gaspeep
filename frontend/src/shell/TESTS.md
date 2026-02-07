# Shell Component Tests

## Test Scenarios for Section 2: Shell (Navigation & Layout)

### 1. Layout & Responsiveness Tests

#### Test 1.1: Mobile Layout (<768px)
**Steps:**
1. Open application on mobile viewport (e.g., 375px width)
2. Verify header is visible at top
3. Verify bottom navigation is visible at bottom
4. Verify sidebar navigation is hidden
5. Verify desktop nav links in header are hidden

**Expected Results:**
- Header height: 64px with logo and user menu
- Bottom nav visible with 4-5 tabs depending on tier
- No sidebar visible
- Content area has 64px bottom padding

#### Test 1.2: Tablet Layout (768px - 1023px)
**Steps:**
1. Resize viewport to 768px width
2. Verify header is visible
3. Verify sidebar navigation appears
4. Verify bottom navigation is hidden
5. Verify desktop nav links appear in header

**Expected Results:**
- Sidebar appears (256px width)
- Bottom navigation disappears
- Desktop nav links visible in header
- Content area has no bottom padding

#### Test 1.3: Desktop Layout (≥1024px)
**Steps:**
1. Resize viewport to 1024px+ width
2. Verify sidebar width increases
3. Verify all navigation elements properly spaced

**Expected Results:**
- Sidebar width: 288px
- Comfortable spacing throughout
- All navigation accessible

### 2. Authentication State Tests

#### Test 2.1: Unauthenticated User
**Steps:**
1. Clear localStorage (auth_token)
2. Refresh page
3. Check header user menu area

**Expected Results:**
- "Log In" and "Sign Up" buttons visible in header
- Click user menu shows login/signup options
- Bottom nav shows: Map, Upgrade, Profile
- "Submit" tab hidden or shows login prompt
- "Alerts" tab hidden or shows upgrade prompt

#### Test 2.2: Authenticated Free User
**Steps:**
1. Log in as free tier user
2. Observe navigation items

**Expected Results:**
- User avatar and name in header
- Bottom nav shows: Map, Submit, Profile, Upgrade
- Sidebar shows: Map, Submit, (locked Alerts with upgrade CTA)
- "Alerts" shows upgrade prompt when clicked
- User menu shows "Free Account" badge
- Upgrade CTA visible in sidebar and user menu

#### Test 2.3: Authenticated Premium User
**Steps:**
1. Log in as premium tier user
2. Observe navigation items

**Expected Results:**
- User avatar with name in header
- Bottom nav shows: Map, Submit, Alerts, Profile
- Sidebar shows: Map, Submit, Alerts (unlocked)
- User menu shows "Premium Member" with crown icon
- No upgrade CTAs visible
- "Enjoying all premium features" message in sidebar

#### Test 2.4: Station Owner User
**Steps:**
1. Log in as user with isStationOwner: true
2. Observe navigation items

**Expected Results:**
- All premium features visible
- Additional "Station Dashboard" link in header nav
- Additional "Station Dashboard" link in sidebar
- Access to dashboard when clicked

### 3. Header Component Tests

#### Test 3.1: Logo Click
**Steps:**
1. Click on "Gas Peep" logo
2. Verify navigation

**Expected Results:**
- Navigates to home page (/)
- URL updates correctly

#### Test 3.2: Desktop Navigation Links
**Steps:**
1. View on desktop (≥768px)
2. Click each navigation link in header
3. Verify active state highlighting

**Expected Results:**
- Map link navigates to /map
- Submit link navigates to /submit (if authenticated)
- Alerts link navigates to /alerts (if premium)
- Dashboard link navigates to /dashboard (if station owner)
- Active route shows blue background and text

#### Test 3.3: User Menu Toggle
**Steps:**
1. Click user avatar/button
2. Verify menu opens
3. Click outside menu
4. Verify menu closes
5. Click avatar again
6. Click a menu item

**Expected Results:**
- Menu opens below user button
- Positioned absolutely, right-aligned
- Closes when clicking outside
- Closes when clicking menu item
- Navigates to selected page

### 4. Bottom Navigation Tests

#### Test 4.1: Tab Navigation (Free User)
**Steps:**
1. Log in as free user
2. Click each bottom nav tab
3. Verify navigation and active states

**Expected Results:**
- Map tab: navigates to /map, shows active state
- Submit tab: navigates to /submit, shows active state
- Profile tab: navigates to /profile, shows active state
- Upgrade tab: navigates to /upgrade, green accent
- Active tab has blue color and bold icon
- Inactive tabs have neutral gray color

#### Test 4.2: Tab Navigation (Premium User)
**Steps:**
1. Log in as premium user
2. Verify bottom nav tabs

**Expected Results:**
- Shows: Map, Submit, Alerts, Profile (no Upgrade)
- Alerts tab functional and navigates to /alerts
- All tabs properly respond to clicks

#### Test 4.3: Active State Highlighting
**Steps:**
1. Navigate to /map
2. Verify Map tab is highlighted
3. Navigate to /submit
4. Verify Submit tab is highlighted

**Expected Results:**
- Active tab: blue-600 color, bold icon
- Inactive tabs: neutral-600 color, normal weight
- Smooth transition between states

### 5. Sidebar Navigation Tests

#### Test 5.1: Navigation Links (Desktop)
**Steps:**
1. View on desktop (≥768px)
2. Click each sidebar link
3. Verify navigation and active states

**Expected Results:**
- Each link navigates correctly
- Active link has blue background
- Links show icon, title, and description
- Hover state changes background

#### Test 5.2: Tier Info Card (Free User)
**Steps:**
1. Log in as free user
2. Scroll to bottom of sidebar
3. Verify tier info card

**Expected Results:**
- Shows "Current Plan: Free"
- Displays description: "Upgrade for ad-free maps..."
- "Upgrade to Premium" button visible
- Button has gradient background
- Clicking navigates to /upgrade

#### Test 5.3: Tier Info Card (Premium User)
**Steps:**
1. Log in as premium user
2. Scroll to bottom of sidebar
3. Verify tier info card

**Expected Results:**
- Shows "Current Plan: Premium"
- Crown icon visible
- "Enjoying all premium features" message
- No upgrade button

#### Test 5.4: Locked Alerts CTA (Free User)
**Steps:**
1. Log in as free user
2. Observe sidebar navigation

**Expected Results:**
- Dashed border box for "Price Alerts"
- Green accent color
- "Unlock with Premium" subtitle
- Bell icon visible
- Clicking navigates to /upgrade

### 6. User Menu Tests

#### Test 6.1: Menu Items (Authenticated)
**Steps:**
1. Log in as any user
2. Open user menu
3. Verify all menu items present

**Expected Results:**
- User name and tier displayed at top
- Profile link
- Account Settings link
- Submission History link
- Alerts link (Premium only)
- Saved Stations link
- Upgrade button (Free users only)
- Log Out button (red, at bottom)

#### Test 6.2: Menu Navigation
**Steps:**
1. Open user menu
2. Click "Profile"
3. Verify navigation and menu closes

**Expected Results:**
- Navigates to /profile
- Menu closes automatically
- URL updates

#### Test 6.3: Logout Functionality
**Steps:**
1. Log in as any user
2. Open user menu
3. Click "Log Out"

**Expected Results:**
- Clears localStorage (auth_token)
- Navigates to /signin
- User state resets
- Navigation items update for unauthenticated state

#### Test 6.4: Upgrade CTA (Free User)
**Steps:**
1. Log in as free user
2. Open user menu
3. Verify upgrade button

**Expected Results:**
- Gradient button visible
- Text: "Upgrade to Premium"
- Crown icon visible
- Clicking navigates to /upgrade

#### Test 6.5: Premium Badge (Premium User)
**Steps:**
1. Log in as premium user
2. Open user menu
3. Verify premium badge

**Expected Results:**
- Crown icon next to tier name
- "Premium Member" text
- No upgrade button
- All menu items accessible

### 7. Dark Mode Tests

#### Test 7.1: Header Dark Mode
**Steps:**
1. Enable dark mode (system or toggle)
2. Verify header styling

**Expected Results:**
- Background: neutral-900
- Text: neutral-50
- Border: neutral-800
- Active links: blue-400
- Logo gradient unchanged

#### Test 7.2: Sidebar Dark Mode
**Steps:**
1. Enable dark mode
2. View sidebar on desktop

**Expected Results:**
- Background: neutral-900
- Text: neutral-300
- Active link: blue-950 background, blue-300 text
- Tier card: neutral-800 background
- Borders: neutral-800

#### Test 7.3: Bottom Nav Dark Mode
**Steps:**
1. Enable dark mode
2. View bottom nav on mobile

**Expected Results:**
- Background: neutral-900
- Inactive icons: neutral-400
- Active icons: blue-400
- Border top: neutral-800

#### Test 7.4: User Menu Dark Mode
**Steps:**
1. Enable dark mode
2. Open user menu

**Expected Results:**
- Background: neutral-800
- Text: neutral-300
- Borders: neutral-700
- Hover states: neutral-700
- Logout: red-400 text, red-950 hover

### 8. Edge Cases & Error Handling

#### Test 8.1: Rapid Navigation Clicks
**Steps:**
1. Rapidly click different navigation items
2. Verify no race conditions or errors

**Expected Results:**
- Navigation handles rapid clicks gracefully
- Active state updates correctly
- No console errors

#### Test 8.2: Deep Link with Auth
**Steps:**
1. Navigate to /alerts (premium page) while logged out
2. Verify redirect behavior

**Expected Results:**
- Protected route redirects to login
- After login, redirects to original destination

#### Test 8.3: Missing User Data
**Steps:**
1. Mock user object with missing fields
2. Verify graceful fallbacks

**Expected Results:**
- Uses default values (tier: 'free')
- No undefined errors
- Navigation still functional

#### Test 8.4: Window Resize During Navigation
**Steps:**
1. Start on mobile layout
2. Navigate to a page
3. Resize to desktop
4. Verify layout updates

**Expected Results:**
- Layout switches smoothly
- Active state preserved
- No content duplication

### 9. Performance Tests

#### Test 9.1: Shell Mounting
**Steps:**
1. Measure component mount time
2. Check for unnecessary re-renders

**Expected Results:**
- Shell mounts in <100ms
- No excessive re-renders on route change
- User menu only re-renders when toggled

#### Test 9.2: Navigation Transitions
**Steps:**
1. Navigate between pages
2. Measure transition time

**Expected Results:**
- Smooth transitions (<16ms frame time)
- No layout shifts
- Active state updates immediately

### 10. Accessibility Tests

#### Test 10.1: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate
2. Use Enter to activate links
3. Use Escape to close user menu

**Expected Results:**
- All interactive elements reachable via keyboard
- Focus indicators visible
- Logical tab order
- User menu closes on Escape

#### Test 10.2: Screen Reader Support
**Steps:**
1. Enable screen reader
2. Navigate through shell components

**Expected Results:**
- All navigation items announced correctly
- ARIA labels present and descriptive
- Active states announced
- User menu state changes announced

#### Test 10.3: Focus Management
**Steps:**
1. Open user menu
2. Tab through items
3. Close menu

**Expected Results:**
- Focus trapped in menu when open
- Focus returns to trigger on close
- Logical focus order

---

## Test Completion Checklist

- [ ] All mobile layout tests pass
- [ ] All tablet layout tests pass
- [ ] All desktop layout tests pass
- [ ] All authentication state tests pass
- [ ] All header component tests pass
- [ ] All bottom navigation tests pass
- [ ] All sidebar navigation tests pass
- [ ] All user menu tests pass
- [ ] All dark mode tests pass
- [ ] All edge cases handled
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari)

---

## Running Tests

### Manual Testing
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Walk through each test scenario above
4. Test on different viewport sizes using browser dev tools
5. Test with different user states (logged out, free, premium)

### Automated Testing (Future)
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual
```

---

## Known Issues / Future Enhancements

- [ ] Add keyboard shortcuts for common navigation
- [ ] Add search functionality in header
- [ ] Add notification badge on alerts icon
- [ ] Add loading states for navigation transitions
- [ ] Add animation for sidebar expand/collapse
- [ ] Add breadcrumb navigation for deep pages
- [ ] Add recently visited pages in user menu
