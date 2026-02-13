import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import MapView from '../components/MapView';
import StationDetailSheet from '../components/StationDetailSheet';
import FilterModal, { FilterState } from '../components/FilterModal';
import { Station } from '../types';
import { calculateDistance, getRadiusFromZoom } from '../../../lib/utils';

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
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: -33.8688,
    lng: 151.2093,
  });
  const [viewport, setViewport] = useState<{ latitude: number; longitude: number; zoom: number }>({
    latitude: -33.8688,
    longitude: 151.2093,
    zoom: 14,
  });
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Refs to track state
  const hasManuallyMovedMap = useRef(false);
  const lastFetchLocation = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's location (only on initial load)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Only update if user hasn't manually moved the map
          if (!hasManuallyMovedMap.current) {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(newLocation);
            setViewport({
              latitude: newLocation.lat,
              longitude: newLocation.lng,
              zoom: 14,
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Prevent body/html scrolling while the map is visible
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Fetch stations helper function
  const fetchStations = useCallback(async (
    location: { lat: number; lng: number },
    zoom: number,
    clearExisting: boolean = false
  ) => {
    const setLoadingState = clearExisting ? setLoading : setIsFetchingMore;
    setLoadingState(true);
    
    try {
      const radius = getRadiusFromZoom(zoom);
      const response = await fetch('/api/stations/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          radiusKm: radius,
          fuelTypes: filters.fuelTypes.length > 0 ? filters.fuelTypes : undefined,
          maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined,
        }),
      });

      if (response.ok) {
        const newStations = await response.json();
        
        if (clearExisting) {
          // Filter change: clear and replace
          setStations(newStations);
        } else {
          // Viewport change: merge and deduplicate
          setStations((prevStations) => {
            // Create a map of existing stations by ID
            const stationsMap = new Map<string, Station>();
            
            // Add existing stations
            prevStations.forEach((station) => {
              stationsMap.set(station.id, station);
            });
            
            // Add/update with new stations
            newStations.forEach((station: Station) => {
              stationsMap.set(station.id, station);
            });
            
            // Convert back to array and calculate distances
            const allStations = Array.from(stationsMap.values());
            
            // Sort by distance from current viewport center and keep closest 200
            const stationsWithDistance = allStations.map((station) => ({
              station,
              distance: calculateDistance(
                location.lat,
                location.lng,
                station.latitude,
                station.longitude
              ),
            }));
            
            stationsWithDistance.sort((a, b) => a.distance - b.distance);
            
            return stationsWithDistance.slice(0, 200).map((item) => item.station);
          });
        }
        
        lastFetchLocation.current = { lat: location.lat, lng: location.lng, zoom };
      } else {
        console.error('Failed to fetch stations');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoadingState(false);
    }
  }, [filters]);

  // Initial fetch and filter changes (clears stations)
  useEffect(() => {
    // Clear stations when filters change
    setStations([]);
    fetchStations(userLocation, viewport.zoom, true);
  }, [filters]);

  // Fetch stations on initial load
  useEffect(() => {
    if (!lastFetchLocation.current) {
      fetchStations(userLocation, viewport.zoom, true);
    }
  }, [userLocation]);

  // Handle viewport changes (accumulates stations)
  const handleViewportChange = useCallback((newViewport: { latitude: number; longitude: number; zoom: number }) => {
    hasManuallyMovedMap.current = true;
    setViewport(newViewport);
    
    // Clear existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Debounce: wait 500ms after user stops dragging
    fetchTimeoutRef.current = setTimeout(() => {
      const lastFetch = lastFetchLocation.current;
      
      // Check if we've moved significantly (>500m) or changed zoom significantly
      if (
        !lastFetch ||
        calculateDistance(lastFetch.lat, lastFetch.lng, newViewport.latitude, newViewport.longitude) > 0.5 ||
        Math.abs(lastFetch.zoom - newViewport.zoom) > 1
      ) {
        fetchStations({ lat: newViewport.latitude, lng: newViewport.longitude }, newViewport.zoom, false);
      }
    }, 500);
  }, [fetchStations]);

  // Search stations
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/stations/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setStations(data);
      }
    } catch (error) {
      console.error('Error searching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 rounded-lg">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1 bg-transparent py-2 outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
        </div>
        <button
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Filter size={20} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
          Loading stations...
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        <MapView
          stations={stations}
          selectedStationId={selectedStation?.id}
          onStationSelect={setSelectedStation}
          userLocation={userLocation}
          onViewportChange={handleViewportChange}
          isFetchingMore={isFetchingMore}
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
          // TODO: Implement navigation to price submission page
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
