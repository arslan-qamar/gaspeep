# Map & Station Browsing — Test Specifications

Test these scenarios to ensure the Map & Station Browsing section meets requirements.

---

## User Flow Tests

### Flow 1: Browse Nearby Stations (Free User)
**Given:** Unauthenticated or Free user on map screen  
**When:** App loads with map centered on user location  
**Then:**
- [ ] Map displays without errors
- [ ] Station markers visible for nearby stations
- [ ] Markers color-coded by price (green/yellow/red)
- [ ] Can scroll map without ads (first scroll shows ad for Free users)
- [ ] Markers cluster at zoom level < 12
- [ ] Individual markers show at zoom level > 12

### Flow 2: Filter by Fuel Type
**Given:** User on map with multiple fuel stations  
**When:** User taps filter button and selects "Diesel"  
**Then:**
- [ ] Filter modal opens
- [ ] Can select/deselect fuel types
- [ ] Diesel checkbox is checked
- [ ] Tapping "Apply" updates map
- [ ] Map only shows stations with Diesel prices
- [ ] Other fuel types hidden
- [ ] Filter badge shows on filter button

### Flow 3: Filter by Price Range
**Given:** User on map with fuel prices visible  
**When:** User adjusts price range slider (e.g., $1.50-$2.00)  
**Then:**
- [ ] Price range slider appears in filter modal
- [ ] Can adjust min and max price
- [ ] "Apply" button enabled/disabled appropriately
- [ ] Map updates to show only stations in price range
- [ ] Markers update color based on filtered range
- [ ] No markers outside range visible

### Flow 4: Search by Location
**Given:** User on map with search bar visible  
**When:** User types "Market Street" in search box  
**Then:**
- [ ] Autocomplete suggestions appear
- [ ] Suggestions show matching addresses/stations
- [ ] Can select a suggestion
- [ ] Map centers on selected location
- [ ] Stations near new location display

### Flow 5: View Station Details
**Given:** User on map with station markers visible  
**When:** User taps a station marker  
**Then:**
- [ ] Station detail sheet slides up from bottom
- [ ] Sheet shows station name, brand, address
- [ ] Distance from user location shown
- [ ] All 11 fuel types displayed with prices
- [ ] Last updated timestamps visible for each price
- [ ] Operating hours shown (if available)
- [ ] Amenities listed (car wash, convenience store, etc.)
- [ ] "Report Price" button visible
- [ ] "Get Directions" button visible

### Flow 6: Submit Price from Map
**Given:** User viewing station details  
**When:** User taps "Report Price" button  
**Then:**
- [ ] Navigation to price submission screen
- [ ] Station pre-populated
- [ ] Fuel type options available
- [ ] Can enter price and submit
- [ ] Returns to map after successful submission

### Flow 7: Get Directions
**Given:** User viewing station details  
**When:** User taps "Get Directions"  
**Then:**
- [ ] Native maps app opens (Google Maps, Apple Maps, etc.)
- [ ] Route to station displayed
- [ ] Can follow navigation

---

## Premium User Experience Tests

### Premium Flow 1: Ad-Free Map Scrolling
**Given:** Premium user on map  
**When:** User scrolls map multiple times  
**Then:**
- [ ] No ads appear
- [ ] Unlimited scrolling allowed
- [ ] Map responds smoothly
- [ ] Performance is consistent

### Premium Flow 2: View Custom Alerts on Map
**Given:** Premium user with active price alerts  
**When:** User views map  
**Then:**
- [ ] Alert coverage areas displayed (optional: as circles)
- [ ] Can tap alert to view details
- [ ] Alert thresholds shown
- [ ] Link to Alerts section

---

## Empty State Tests

### Empty State 1: No Stations in Area
**Given:** User searches in remote area with no fuel stations  
**When:** Map loads  
**Then:**
- [ ] Map displays with empty state message
- [ ] "No stations found" text visible
- [ ] Suggestion to zoom out or change filters
- [ ] Map navigation still works

### Empty State 2: No Prices Available
**Given:** Station selected but no prices available  
**When:** Station detail sheet opens  
**Then:**
- [ ] Station name and location shown
- [ ] Fuel type rows show "No price available"
- [ ] Can still submit price
- [ ] "Report Price" button prominent

---

## Error State Tests

### Error 1: Failed to Load Map
**Given:** Map library fails to load  
**When:** App renders map component  
**Then:**
- [ ] Error message displays
- [ ] User can retry
- [ ] Fallback UI shows (list view maybe)

### Error 2: Location Permission Denied
**Given:** User denies location access  
**When:** App requests location permission  
**Then:**
- [ ] Map displays without "Use Current Location"
- [ ] Default location or prompt to enable location
- [ ] Manual location entry still works

### Error 3: Failed to Fetch Stations
**Given:** API request for stations fails  
**When:** Map tries to load stations  
**Then:**
- [ ] Error message displays
- [ ] "Retry" button visible
- [ ] Map framework visible even if data fails

---

## Responsive Design Tests

### Mobile (< 768px)
**When:** Viewing map on phone  
**Then:**
- [ ] Map uses full screen height (100vh or similar)
- [ ] Bottom detail sheet has bottom nav above it
- [ ] Filter button accessible (bottom-right)
- [ ] Search bar visible and usable
- [ ] Touch interactions work (swipe, pinch-zoom)
- [ ] Detail sheet slides up smoothly
- [ ] Detail sheet can be dismissed (swipe down)

### Tablet (768px - 1024px)
**When:** Viewing map on tablet  
**Then:**
- [ ] Map takes up appropriate width
- [ ] Detail sheet appears as sidebar (optional)
- [ ] Layout adapts to medium screen
- [ ] Touch interactions work

### Desktop (> 1024px)
**When:** Viewing map on desktop  
**Then:**
- [ ] Map takes up full available width
- [ ] Detail sheet can appear as sidebar
- [ ] All controls visible and accessible
- [ ] Mouse interactions work (hover states)

---

## Dark Mode Tests

### Dark Mode 1: Map Colors
**When:** Dark mode enabled  
**Then:**
- [ ] Map background is dark
- [ ] Text is light/readable
- [ ] Markers still visible (not same color as background)
- [ ] Filter modal dark background
- [ ] Detail sheet dark background

### Dark Mode 2: UI Elements
**When:** Dark mode enabled  
**Then:**
- [ ] All UI text readable
- [ ] Buttons contrast adequate (WCAG AA)
- [ ] Input fields have dark background
- [ ] Icons visible and readable

---

## Performance Tests

### Performance 1: Map Clustering
**When:** User zooms in/out  
**Then:**
- [ ] Clustering updates smoothly
- [ ] No lag or stutter
- [ ] Transitions are fluid
- [ ] Performance remains consistent with 100+ stations

### Performance 2: Filter Application
**When:** User applies filters  
**Then:**
- [ ] Filter updates visible within 500ms
- [ ] No noticeable lag
- [ ] Map remains responsive

### Performance 3: Marker Rendering
**When:** Map displays 50+ markers  
**Then:**
- [ ] All markers render without lag
- [ ] Scrolling smooth
- [ ] No dropped frames

---

## Accessibility Tests

### Accessibility 1: Keyboard Navigation
**When:** Using keyboard only  
**Then:**
- [ ] Filter button accessible with Tab key
- [ ] Can open/close modals
- [ ] Enter/Space to activate buttons
- [ ] Escape to close modals

### Accessibility 2: Screen Reader
**When:** Using screen reader  
**Then:**
- [ ] Station names announced
- [ ] Prices announced when focused
- [ ] Button purposes clear
- [ ] Filter status announced

### Accessibility 3: Color Contrast
**When:** Viewing map  
**Then:**
- [ ] Text has min 4.5:1 contrast ratio
- [ ] Buttons have adequate contrast
- [ ] Icons understandable without color alone

---

## Edge Cases

### Edge Case 1: Very Long Station Name
**Given:** Station with 100+ character name  
**When:** Detail sheet opens  
**Then:**
- [ ] Name truncates gracefully
- [ ] Full name in tooltip (optional)
- [ ] Layout doesn't break

### Edge Case 2: Very High Price
**Given:** Station with fuel price > $10/liter  
**When:** Detail sheet shows price  
**Then:**
- [ ] Price displays correctly
- [ ] Formatting doesn't overflow
- [ ] Still color-coded appropriately

### Edge Case 3: Many Amenities
**Given:** Station with 15+ amenities  
**When:** Detail sheet displays amenities  
**Then:**
- [ ] All amenities visible
- [ ] List scrollable if needed
- [ ] Doesn't break layout

---

## Browser/Platform Tests

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Platforms
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive Web Design

---

## Integration Tests

### Integration 1: Authentication State
**Given:** User logs in  
**When:** Navigates to map  
**Then:**
- [ ] User tier respected (Free/Premium)
- [ ] Ad state managed correctly
- [ ] Location preferences loaded

### Integration 2: Data Updates
**Given:** Another user submits new price  
**When:** Time passes (1-5 minutes)  
**Then:**
- [ ] Map eventually shows updated price (within 5 min)
- [ ] Markers update color if price changed

---

## Success Criteria

✅ All flows execute without errors  
✅ UI responsive across all screen sizes  
✅ Dark mode fully functional  
✅ Performance smooth with 50+ stations  
✅ Empty and error states handled  
✅ Premium experience differs from Free  
✅ Accessibility standards met (WCAG 2.1 AA)  
