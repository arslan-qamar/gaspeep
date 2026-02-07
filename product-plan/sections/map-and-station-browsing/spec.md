# Map & Station Browsing — Section Specification

**Section ID:** `map-browsing`

---

## Overview

The Map & Station Browsing section is the core interface of Gas Peep. It provides an interactive, geospatial view of fuel stations with real-time pricing information. Users can explore stations on a map, view detailed price information for all 11 fuel types, and filter results by fuel type and price range.

This section serves as the primary entry point for both Free and Premium users, with tier-specific experiences (ad-supported scrolling for Free users, ad-free for Premium).

---

## User Stories

### As a Free User
- I want to see fuel stations on an interactive map so I can find nearby options
- I want to view current prices for all fuel types at each station
- I want to filter stations by fuel type so I only see relevant results
- I want to filter by price range so I can find the cheapest options
- I want to search for stations by location/address
- I am willing to view an ad before scrolling the map (ad-supported experience)

### As a Premium User
- I want all the Free user features plus ad-free map scrolling
- I want unlimited map interaction without interruptions
- I want to see my custom alerts overlaid on the map

### All Users
- I want to see station details (name, brand, address, amenities)
- I want to see the last updated timestamp for prices
- I want to tap a station marker to see its details
- I want the map to center on my current location
- I want to see distance from my location to each station

---

## Screen Designs

### 1. MapView
**Primary screen** — Full-screen interactive map with station markers

**Components:**
- Interactive map (using map SDK - Mapbox, Google Maps, or similar)
- Station markers (color-coded by best price or fuel type)
- Current location indicator
- Filter button (floating action button)
- Search bar (collapsible at top)
- Station detail sheet (bottom sheet, appears on marker tap)
- Ad interstitial (Free users only, shown on first map load)

**Map Markers:**
- Show station icon
- Color indicates relative price (green = low, yellow = medium, red = high)
- Cluster markers when zoomed out
- Individual markers when zoomed in
- Active marker is highlighted when station detail sheet is open

**Search Bar:**
- Floating at top of map
- Auto-suggest as user types
- Search by address, city, zip code, or station name
- "Use Current Location" quick action

**Filter Button:**
- Floating action button in bottom-right
- Opens filter modal/sheet
- Shows active filter count badge

---

### 2. StationDetailSheet
**Bottom sheet** — Detailed view of selected station

**Content:**
- Station name and brand
- Address with "Get Directions" link
- Distance from user's current location
- Operating hours
- Amenities (car wash, convenience store, restroom, etc.)
- Price table for all 11 fuel types
- Last updated timestamp for each price
- "Report Price" button (navigates to price submission)
- Community submission count indicator

**Price Table:**
- Fuel type name and icon
- Current price (large, prominent)
- Price trend indicator (up/down/stable) if available
- Last updated time (e.g., "2h ago")
- Grayed out if price not available
- Sorted by display order from data model

**Interactions:**
- Swipe down to dismiss
- Swipe up to expand to full height
- Tap outside to dismiss
- "Get Directions" opens native maps app
- "Report Price" navigates to submission flow

---

### 3. FilterModal
**Modal/Sheet** — Filter stations by fuel type and price range

**Filters:**

**Fuel Type Filter:**
- "All Fuel Types" option (default)
- Checkboxes for each of 11 fuel types
- Multi-select (can select multiple types)
- Apply button updates map markers

**Price Range Filter:**
- Applies to selected fuel type(s)
- Slider with min/max values
- Shows price distribution histogram
- "Under $X.XX" quick filters
- "Reset" button clears all filters

**Active Filters Display:**
- Shows currently applied filters as chips
- Tap chip to remove that filter
- "Clear All" button

**Interactions:**
- "Apply" button closes modal and updates map
- "Cancel" button closes without applying changes
- Filter state persists across sessions

---

### 4. AdInterstitial (Free Users)
**Interstitial screen** — Ad display before map interaction

**Content:**
- Ad creative (banner or video)
- "Continue to Map" button (enabled after ad view/timeout)
- "Upgrade to Premium" link (removes ads permanently)
- Close button (X) in corner

**Behavior:**
- Shows on first map load per session (Free users only)
- Auto-advances after ad completes (if video)
- Manual advance after 5 seconds (if banner)
- Does not show to Premium users
- Can be dismissed but may show again after time period

---

## Data Requirements

### Station Data
```typescript
interface Station {
  id: string
  name: string
  brand: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  operatingHours?: {
    open: string  // "24 hours" or "6:00 AM"
    close?: string // "10:00 PM" or null if 24h
  }
  amenities: string[]  // ["Car Wash", "Convenience Store", "Restroom"]
  lastVerified: string  // ISO timestamp
}
```

### Fuel Price Data
```typescript
interface FuelPrice {
  id: string
  stationId: string
  fuelType: string  // "E10", "Diesel", etc.
  price: number
  currency: string  // "USD"
  unit: string  // "gallon" or "liter"
  lastUpdated: string  // ISO timestamp
  verificationConfidence: number  // 0-100
  submissionCount: number
}
```

### Filter State
```typescript
interface FilterState {
  fuelTypes: string[]  // Empty array = all types
  priceRange: {
    min: number
    max: number
  } | null
}
```

---

## User Flows

### Primary Flow: Find Cheapest Gas Nearby
1. User opens app → Map view loads centered on current location
2. Free user sees ad interstitial → Dismisses after timeout
3. Map shows all nearby stations with markers
4. User taps filter button
5. User selects "Unleaded 91" fuel type
6. User sets price range "$3.00 - $3.50"
7. User taps "Apply"
8. Map updates to show only matching stations
9. User taps a marker to see station details
10. User reviews prices and gets directions

### Secondary Flow: Search Specific Location
1. User taps search bar at top
2. User types "123 Main St, Springfield"
3. Suggestions appear as user types
4. User selects suggestion
5. Map centers on searched location
6. User browses stations in that area

### Premium Flow: Ad-Free Experience
1. Premium user opens app
2. Map loads immediately (no ad)
3. User scrolls and explores freely
4. All interaction is uninterrupted

---

## Responsive Design

### Mobile (< 768px)
- Full-screen map with minimal chrome
- Search bar collapses to icon in top-right
- Filter button floating in bottom-right
- Station detail as bottom sheet (swipeable)
- Touch-optimized marker sizes

### Tablet (768px - 1023px)
- Map takes 60-70% of screen
- Station detail panel on right side (persistent)
- Search bar expanded at top
- Filter panel slides in from right

### Desktop (≥ 1024px)
- Map takes left 60-70%
- Station detail and filter panel on right
- Search bar embedded in header
- Hover states on markers
- Click to select station (no bottom sheet)

---

## Tier-Specific Features

### Free Users
- ❌ See ad interstitial before map scrolling
- ✅ Can view all station data
- ✅ Can use filters and search
- ✅ Can submit prices
- ⚠️ Limited map interactions per session (potential future restriction)

### Premium Users
- ✅ No ads, immediate map access
- ✅ Unlimited map interactions
- ✅ All Free features plus enhanced experience
- ✅ Can see their custom alerts on map (future integration)

---

## Edge Cases & Empty States

### No Stations in View
- Message: "No stations found in this area"
- "Zoom out" button to expand search radius
- "Clear filters" if filters are active

### No Prices Available for Station
- Show "Price not available" in gray
- "Be the first to report" CTA
- Direct link to price submission

### Location Permission Denied
- Map centers on default location (city center)
- Banner: "Enable location access for better results"
- Manual search remains available

### Offline Mode
- Show cached stations (if available)
- "You're offline" banner
- Disable price submissions
- Disable filter updates

### Slow Network
- Show loading skeleton for map
- Progressive marker loading
- Cached data displayed first
- Spinner on price updates

---

## Success Metrics

- Time to first station view
- Number of stations viewed per session
- Filter usage rate
- Price submission rate (from map view)
- Ad view completion rate (Free users)
- Premium conversion from map screen

---

## Technical Considerations

### Map SDK
- Use Mapbox GL JS or Google Maps Platform
- Optimize marker clustering for performance
- Implement lazy loading for station details
- Cache map tiles for offline support

### Geospatial Queries
- Use PostGIS for radius-based station queries
- Index on coordinates for fast lookups
- Implement viewport-based loading (only load visible stations)

### Real-time Updates
- WebSocket or polling for price updates
- Optimistic UI updates on filter changes
- Background sync for cached data

### Performance
- Limit markers rendered at once (cluster beyond threshold)
- Debounce filter changes
- Lazy load station details on demand
- Optimize bundle size (map SDK is large)

---

## Accessibility

- Screen reader support for map controls
- Keyboard navigation for filter controls
- High contrast mode support
- Text alternatives for map markers
- Focus management for bottom sheet
- ARIA labels for all interactive elements

---

## Future Enhancements

- Save favorite stations
- Station price history graphs
- Route planning with fuel stops
- Augmented reality view
- Drive mode (hands-free voice navigation)
- Community ratings and reviews
- Station photo gallery
