# Map & Station Browsing — Component Structure

## Components to Implement

### 1. MapView.tsx
Main interactive map interface displaying fuel stations.

**Props:**
```typescript
interface MapViewProps {
  stations: Station[];
  selectedStationId?: string;
  filters: MapFilter;
  userLocation?: Coordinates;
  onStationSelect: (stationId: string) => void;
  onStationDeselect: () => void;
  onMapInteraction?: (bounds: MapBounds) => void;
  isLoading?: boolean;
}
```

**Features:**
- Interactive map with clustering
- Color-coded markers (green/yellow/red by price)
- Current location indicator
- Click handlers for markers
- Responsive to zoom level
- Support for dark mode

### 2. StationDetailSheet.tsx
Bottom sheet displaying detailed station information.

**Props:**
```typescript
interface StationDetailSheetProps {
  station: StationDetail;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrice: () => void;
  onGetDirections: () => void;
}
```

**Features:**
- Station name, brand, address
- Distance calculation
- Fuel prices table (all 11 types)
- Last updated timestamps
- Amenities display
- Action buttons

### 3. FilterModal.tsx
Filter UI for fuel type and price range.

**Props:**
```typescript
interface FilterModalProps {
  isOpen: boolean;
  filters: MapFilter;
  onFilterChange: (filters: MapFilter) => void;
  onClose: () => void;
}
```

**Features:**
- Fuel type selection (multi-select)
- Price range slider
- Radius selector
- Apply/Reset buttons

### 4. SearchBar.tsx
Location and station search interface.

**Props:**
```typescript
interface SearchBarProps {
  onSearch: (query: StationSearchQuery) => void;
  onLocationClick: () => void;
  isSearching?: boolean;
}
```

**Features:**
- Text input with autocomplete
- "Use Current Location" quick action
- Recent searches display
- Search history

---

## Data Flow

```
MapView (main container)
├── SearchBar (top)
├── Map (center, interactive)
│   ├── Markers (clickable stations)
│   └── Clustering
├── FilterButton (bottom-right)
└── StationDetailSheet (bottom, conditional)
    ├── Price Table
    └── Action Buttons

Modal Layers:
- FilterModal (controlled)
- SearchModal (controlled)
```

---

## Integration Checklist

- [ ] Map library initialized (Mapbox/Google Maps)
- [ ] Stations load and display correctly
- [ ] Markers cluster at zoom levels < 12
- [ ] Individual markers show at zoom > 12
- [ ] Color coding reflects price ranges
- [ ] Station detail sheet opens on marker click
- [ ] Filters work and update map display
- [ ] Search functionality autocompletes
- [ ] User location shows with permission
- [ ] Distance calculations accurate
- [ ] Responsive on mobile < 768px
- [ ] Responsive on tablet/desktop ≥ 768px
- [ ] Dark mode fully functional
- [ ] Loading states shown
- [ ] Error states handled

---

## Styling (Tailwind CSS v4)

```css
/* Map container */
.map-container {
  @apply w-full h-screen md:h-[calc(100vh-64px)];
}

/* Markers and popups */
.marker-green { @apply !bg-green-500; }
.marker-yellow { @apply !bg-yellow-500; }
.marker-red { @apply !bg-red-500; }

/* Detail sheet */
.station-detail-sheet {
  @apply fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-xl shadow-lg z-40;
  @apply max-h-[90vh] overflow-y-auto;
}

/* Price table */
.price-table {
  @apply w-full divide-y divide-slate-200 dark:divide-slate-700;
}
```

---

## See Also
- Specification: [spec.md](spec.md)
- Types: [types.ts](types.ts)
- Sample Data: [sample-data.json](sample-data.json)
- Tests: [tests.md](tests.md)
