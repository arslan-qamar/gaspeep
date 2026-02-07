# Phase 3: Map & Station Browsing Section

**Duration:** 2-3 days  
**Goal:** Build the interactive map interface with real-time fuel price display and station details

---

## Overview

This section is the core of Gas Peep. Users can:
- View stations on an interactive map
- See real-time fuel prices
- Filter by fuel type and price range
- Search for specific stations
- View detailed station information

---

## Step 1: Install Mapping Library

### 1.1 Add Mapbox GL JS

```bash
npm install mapbox-gl react-map-gl lucide-react
npm install --save-dev @types/mapbox-gl
```

Get a free Mapbox access token from [mapbox.com](https://account.mapbox.com/auth/signin/)

### 1.2 Store Token in .env

```env
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

---

## Step 2: Backend - Stations API

### 2.1 Station Model & Repository

`internal/models/station.go`:

```go
package models

type Station struct {
  ID              string  `json:"id"`
  Name            string  `json:"name"`
  Brand           string  `json:"brand"`
  Address         string  `json:"address"`
  Latitude        float64 `json:"latitude"`
  Longitude       float64 `json:"longitude"`
  OperatingHours  string  `json:"operatingHours"`
  Amenities       []string `json:"amenities"`
  LastVerifiedAt  string  `json:"lastVerifiedAt"`
  Prices          []FuelPriceData `json:"prices"`
}

type FuelPriceData struct {
  FuelTypeID    string  `json:"fuelTypeId"`
  FuelTypeName  string  `json:"fuelTypeName"`
  Price         float64 `json:"price"`
  Currency      string  `json:"currency"`
  LastUpdated   string  `json:"lastUpdated"`
  Verified      bool    `json:"verified"`
}

type StationsNearbyRequest struct {
  Latitude  float64 `json:"latitude" binding:"required"`
  Longitude float64 `json:"longitude" binding:"required"`
  RadiusKm  int     `json:"radiusKm" binding:"required,min=1,max=50"`
  FuelTypes []string `json:"fuelTypes"`
  MaxPrice  float64 `json:"maxPrice"`
}
```

`internal/repository/station_repository.go`:

```go
package repository

import (
  "database/sql"
  "fmt"
  "yourmodule/internal/models"
)

type StationRepository struct {
  db *sql.DB
}

func NewStationRepository(db *sql.DB) *StationRepository {
  return &StationRepository{db: db}
}

// GetStationsNearby returns stations within radius with fuel prices
func (r *StationRepository) GetStationsNearby(
  lat, lon float64,
  radiusKm int,
  fuelTypes []string,
  maxPrice float64,
) ([]models.Station, error) {
  query := `
    SELECT 
      s.id, s.name, s.brand, s.address,
      ST_Y(s.coordinates::geometry) as latitude,
      ST_X(s.coordinates::geometry) as longitude,
      s.operating_hours, s.amenities, s.last_verified_at,
      fp.fuel_type_id, ft.name, fp.price, fp.currency, fp.last_updated_at,
      fp.verification_status = 'verified' as verified
    FROM stations s
    LEFT JOIN fuel_prices fp ON s.id = fp.station_id
    LEFT JOIN fuel_types ft ON fp.fuel_type_id = ft.id
    WHERE ST_DWithin(s.coordinates::geography, ST_MakePoint($1, $2)::geography, $3 * 1000)
  `

  args := []interface{}{lon, lat, radiusKm}

  if len(fuelTypes) > 0 {
    query += ` AND fp.fuel_type_id = ANY($4)`
    args = append(args, fuelTypes)
  }

  if maxPrice > 0 {
    query += ` AND fp.price <= $5`
    args = append(args, maxPrice)
  }

  query += ` ORDER BY ST_Distance(s.coordinates::geography, ST_MakePoint($1, $2)::geography)`

  rows, err := r.db.Query(query, args...)
  if err != nil {
    return nil, err
  }
  defer rows.Close()

  stations := make(map[string]*models.Station)

  for rows.Next() {
    var (
      id, name, brand, address, operatingHours string
      lat, lon float64
      amenities pq.StringArray
      lastVerified sql.NullString
      fuelTypeID sql.NullString
      fuelTypeName, currency sql.NullString
      price sql.NullFloat64
      lastUpdated sql.NullString
      verified sql.NullBool
    )

    err := rows.Scan(
      &id, &name, &brand, &address, &lat, &lon,
      &operatingHours, &amenities, &lastVerified,
      &fuelTypeID, &fuelTypeName, &price, &currency, &lastUpdated, &verified,
    )
    if err != nil {
      return nil, err
    }

    if _, exists := stations[id]; !exists {
      stations[id] = &models.Station{
        ID:             id,
        Name:           name,
        Brand:          brand,
        Address:        address,
        Latitude:       lat,
        Longitude:      lon,
        OperatingHours: operatingHours,
        Amenities:      amenities,
        LastVerifiedAt: lastVerified.String,
        Prices:         []models.FuelPriceData{},
      }
    }

    if fuelTypeID.Valid && price.Valid {
      stations[id].Prices = append(stations[id].Prices, models.FuelPriceData{
        FuelTypeID:   fuelTypeID.String,
        FuelTypeName: fuelTypeName.String,
        Price:        price.Float64,
        Currency:     currency.String,
        LastUpdated:  lastUpdated.String,
        Verified:     verified.Bool,
      })
    }
  }

  result := make([]models.Station, 0, len(stations))
  for _, station := range stations {
    result = append(result, *station)
  }

  return result, nil
}

// GetStationByID returns a single station with prices
func (r *StationRepository) GetStationByID(id string) (*models.Station, error) {
  // Similar query but filtered by station ID
  // Implementation similar to GetStationsNearby
  return nil, nil
}

// SearchStations searches by name or address
func (r *StationRepository) SearchStations(query string, limit int) ([]models.Station, error) {
  // Implementation for text search
  return nil, nil
}
```

### 2.2 Handler Routes

`internal/handlers/station_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/repository"
)

type StationHandler struct {
  stationRepo *repository.StationRepository
}

func NewStationHandler(stationRepo *repository.StationRepository) *StationHandler {
  return &StationHandler{stationRepo: stationRepo}
}

// GET /api/stations/nearby
func (h *StationHandler) GetStationsNearby(c *gin.Context) {
  var req struct {
    Latitude  float64  `json:"latitude" binding:"required"`
    Longitude float64  `json:"longitude" binding:"required"`
    RadiusKm  int      `json:"radiusKm" binding:"required,min=1,max=50"`
    FuelTypes []string `json:"fuelTypes"`
    MaxPrice  float64  `json:"maxPrice"`
  }

  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid parameters"})
    return
  }

  stations, err := h.stationRepo.GetStationsNearby(
    req.Latitude, req.Longitude, req.RadiusKm,
    req.FuelTypes, req.MaxPrice,
  )
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to fetch stations"})
    return
  }

  c.JSON(200, stations)
}

// GET /api/stations/:id
func (h *StationHandler) GetStation(c *gin.Context) {
  id := c.Param("id")
  station, err := h.stationRepo.GetStationByID(id)
  if err != nil {
    c.JSON(404, gin.H{"error": "Station not found"})
    return
  }

  c.JSON(200, station)
}

// GET /api/stations/search
func (h *StationHandler) SearchStations(c *gin.Context) {
  query := c.Query("q")
  limit := 20

  stations, err := h.stationRepo.SearchStations(query, limit)
  if err != nil {
    c.JSON(500, gin.H{"error": "Search failed"})
    return
  }

  c.JSON(200, stations)
}
```

Register routes in `main.go`:

```go
stationHandler := handlers.NewStationHandler(stationRepo)

api := router.Group("/api")
{
  stations := api.Group("/stations")
  {
    stations.POST("/nearby", stationHandler.GetStationsNearby)
    stations.GET("/:id", stationHandler.GetStation)
    stations.GET("/search", stationHandler.SearchStations)
  }
}
```

---

## Step 3: Frontend Components

### 3.1 MapView Component

`src/sections/map-and-station-browsing/components/MapView.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Station } from '../types';

interface MapViewProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  selectedStationId?: string;
  userLocation?: { lat: number; lng: number };
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const MapView: React.FC<MapViewProps> = ({
  stations,
  onStationSelect,
  selectedStationId,
  userLocation = { lat: 40.7128, lng: -74.006 },
}) => {
  const [viewport, setViewport] = useState({
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    zoom: 14,
  });

  const handleMarkerClick = useCallback(
    (station: Station) => {
      onStationSelect(station);
      setViewport({
        latitude: station.latitude,
        longitude: station.longitude,
        zoom: 15,
      });
    },
    [onStationSelect],
  );

  return (
    <Map
      {...viewport}
      onMove={(evt) => setViewport(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v10"
    >
      <NavigationControl position="top-right" />

      {/* User Location */}
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        </Marker>
      )}

      {/* Stations */}
      {stations.map((station) => (
        <Marker
          key={station.id}
          longitude={station.longitude}
          latitude={station.latitude}
          onClick={() => handleMarkerClick(station)}
        >
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all cursor-pointer ${
              selectedStationId === station.id
                ? 'bg-lime-600 shadow-lg scale-110'
                : 'bg-lime-500 hover:bg-lime-600'
            }`}
          >
            ${Math.min(...station.prices.map((p) => p.price)).toFixed(2)}
          </button>
        </Marker>
      ))}

      {/* Popup for selected station */}
      {selectedStationId && stations.find((s) => s.id === selectedStationId) && (
        <Popup
          longitude={
            stations.find((s) => s.id === selectedStationId)?.longitude || 0
          }
          latitude={
            stations.find((s) => s.id === selectedStationId)?.latitude || 0
          }
          closeButton={false}
          closeOnClick={false}
        >
          <div className="p-2">
            <p className="font-bold text-sm">
              {stations.find((s) => s.id === selectedStationId)?.name}
            </p>
            <p className="text-xs text-slate-600">Click for details</p>
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default MapView;
```

### 3.2 StationDetailSheet Component

`src/sections/map-and-station-browsing/components/StationDetailSheet.tsx`:

```tsx
import React from 'react';
import { X, Clock, MapPin, Fuel } from 'lucide-react';
import { Station } from '../types';

interface StationDetailSheetProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrice?: (stationId: string, fuelTypeId: string) => void;
}

export const StationDetailSheet: React.FC<StationDetailSheetProps> = ({
  station,
  isOpen,
  onClose,
  onSubmitPrice,
}) => {
  if (!isOpen || !station) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="text-xl font-bold">{station.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin size={20} className="text-slate-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
              <p className="font-medium">{station.address}</p>
            </div>
          </div>

          {/* Hours */}
          {station.operatingHours && (
            <div className="flex items-start gap-2">
              <Clock size={20} className="text-slate-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Hours</p>
                <p className="font-medium">{station.operatingHours}</p>
              </div>
            </div>
          )}

          {/* Fuel Prices */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Fuel size={20} />
              Current Prices
            </h3>
            <div className="space-y-2">
              {station.prices.map((price) => (
                <div
                  key={price.fuelTypeId}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{price.fuelTypeName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {price.verified ? '✓ Verified' : 'Unverified'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${price.price.toFixed(2)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      per {price.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Price Button */}
          <button
            onClick={() => {
              if (station.prices.length > 0) {
                onSubmitPrice?.(station.id, station.prices[0].fuelTypeId);
              }
            }}
            className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Update Price
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationDetailSheet;
```

### 3.3 FilterModal Component

`src/sections/map-and-station-browsing/components/FilterModal.tsx`:

```tsx
import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';

export interface FilterState {
  fuelTypes: string[];
  maxPrice: number;
  onlyVerified: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

const FUEL_TYPES = [
  { id: 'e10', label: 'E10' },
  { id: 'unleaded-91', label: 'Unleaded 91' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'u95', label: 'U95' },
  { id: 'u98', label: 'U98' },
  { id: 'lpg', label: 'LPG' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleFuelTypeToggle = (fuelTypeId: string) => {
    setLocalFilters({
      ...localFilters,
      fuelTypes: localFilters.fuelTypes.includes(fuelTypeId)
        ? localFilters.fuelTypes.filter((id) => id !== fuelTypeId)
        : [...localFilters.fuelTypes, fuelTypeId],
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <h3 className="font-bold text-lg">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Fuel Types */}
          <div>
            <h4 className="font-semibold mb-2">Fuel Types</h4>
            <div className="space-y-2">
              {FUEL_TYPES.map((ft) => (
                <label key={ft.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.fuelTypes.includes(ft.id)}
                    onChange={() => handleFuelTypeToggle(ft.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span>{ft.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="block font-semibold mb-2">
              Max Price: ${localFilters.maxPrice.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.10"
              value={localFilters.maxPrice}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  maxPrice: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {/* Verified Only */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.onlyVerified}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  onlyVerified: e.target.checked,
                })
              }
              className="w-4 h-4 rounded"
            />
            <span>Show verified prices only</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
```

### 3.4 Main Map Page

`src/sections/map-and-station-browsing/pages/MapPage.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import MapView from '../components/MapView';
import StationDetailSheet from '../components/StationDetailSheet';
import FilterModal, { FilterState } from '../components/FilterModal';
import { Station } from '../types';

export const MapPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    fuelTypes: [],
    maxPrice: 10,
    onlyVerified: false,
  });

  useEffect(() => {
    // Fetch stations from API
    // const fetchStations = async () => {
    //   const response = await fetch('/api/stations/nearby', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       latitude: 40.7128,
    //       longitude: -74.006,
    //       radiusKm: 5,
    //       fuelTypes: filters.fuelTypes,
    //       maxPrice: filters.maxPrice,
    //     }),
    //   });
    //   const data = await response.json();
    //   setStations(data);
    // };
    // fetchStations();
  }, [filters]);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 rounded-lg">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent py-2 outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
        </div>
        <button
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors"
        >
          <Filter size={20} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          stations={stations}
          selectedStationId={selectedStation?.id}
          onStationSelect={setSelectedStation}
          userLocation={{ lat: 40.7128, lng: -74.006 }}
        />
      </div>

      {/* Station Detail Sheet */}
      <StationDetailSheet
        station={selectedStation}
        isOpen={!!selectedStation}
        onClose={() => setSelectedStation(null)}
        onSubmitPrice={(stationId, fuelTypeId) => {
          // Navigate to price submission
          console.log('Submit price for', stationId, fuelTypeId);
        }}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setFilterModalOpen(false)}
      />
    </div>
  );
};

export default MapPage;
```

---

## Step 4: TypeScript Types

`src/sections/map-and-station-browsing/types/index.ts`:

```tsx
export interface Station {
  id: string;
  name: string;
  brand?: string;
  address: string;
  latitude: number;
  longitude: number;
  operatingHours?: string;
  amenities?: string[];
  lastVerifiedAt?: string;
  prices: FuelPrice[];
}

export interface FuelPrice {
  fuelTypeId: string;
  fuelTypeName: string;
  price: number;
  currency: string;
  unit: string;
  lastUpdated: string;
  verified: boolean;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}
```

---

## Checklist for Phase 3

- [ ] Mapbox GL JS installed and configured
- [ ] Backend API endpoints for stations working
- [ ] Station repository queries tested
- [ ] MapView component renders map
- [ ] Station markers displayed on map
- [ ] StationDetailSheet opens when marker clicked
- [ ] FilterModal working for fuel types and price range
- [ ] Search functionality implemented
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Dark mode working
- [ ] Real-time price display accurate
- [ ] API data fetching working

---

## Testing Map Section

```bash
npm run dev

# Visit http://localhost:5173/map
# Should see:
# - Interactive Mapbox map
# - Station markers with prices
# - Search bar and filter button
# - Click marker to see detail sheet
```

---

## Next Phase

→ Continue to **Phase 4: Price Submission System** once map is complete.

Users can now browse prices; next they'll submit new ones.
