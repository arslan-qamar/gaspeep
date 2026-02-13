import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const navigate = useNavigate();

  // Refs — use refs for values only needed in callbacks/effects, not in render
  const lastFetchLocation = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const viewportRef = useRef({ latitude: -33.8688, longitude: 151.2093, zoom: 14 });
  const prevFiltersRef = useRef(filters);

  // Fetch stations — aborts any in-flight request to prevent race conditions
  const fetchStations = useCallback(async (
    location: { lat: number; lng: number },
    zoom: number,
    clearExisting: boolean = false
  ) => {
    // Abort any in-flight request so only the latest fetch wins
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Mark requested location immediately to prevent duplicate triggers
    lastFetchLocation.current = { lat: location.lat, lng: location.lng, zoom };
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
        signal: controller.signal,
      });

      if (response.ok) {
        const newStations = await response.json();

        if (clearExisting) {
          setStations(newStations);
        } else {
          // Viewport change: merge and deduplicate
          setStations((prevStations) => {
            const stationsMap = new Map<string, Station>();
            prevStations.forEach((station) => stationsMap.set(station.id, station));
            newStations.forEach((station: Station) => stationsMap.set(station.id, station));

            return Array.from(stationsMap.values())
              .map((station) => ({
                station,
                distance: calculateDistance(
                  location.lat, location.lng,
                  station.latitude, station.longitude
                ),
              }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 200)
              .map((item) => item.station);
          });
        }
      } else {
        console.error('Failed to fetch stations');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Error fetching stations:', error);
      // Reset lastFetchLocation so retries may occur
      lastFetchLocation.current = null;
    } finally {
      if (!controller.signal.aborted) {
        setLoadingState(false);
      }
    }
  }, [filters]);

  // Get user's location (only on initial load)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
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

  // Fetch stations when userLocation changes (initial load + geolocation resolution).
  // AbortController ensures if geolocation resolves while the default-location fetch
  // is in flight, the stale fetch is cancelled and only the new one completes.
  useEffect(() => {
    viewportRef.current = { latitude: userLocation.lat, longitude: userLocation.lng, zoom: 14 };
    fetchStations(userLocation, 14, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Re-fetch when filters change (skip initial render via reference comparison)
  useEffect(() => {
    if (prevFiltersRef.current === filters) return;
    prevFiltersRef.current = filters;

    const vp = viewportRef.current;
    fetchStations({ lat: vp.latitude, lng: vp.longitude }, vp.zoom, true);
  }, [filters, fetchStations]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handle map move end — called once when the user stops panning/zooming
  const handleViewportChange = useCallback((newViewport: { latitude: number; longitude: number; zoom: number }) => {
    viewportRef.current = newViewport;

    const last = lastFetchLocation.current;
    if (
      !last ||
      calculateDistance(last.lat, last.lng, newViewport.latitude, newViewport.longitude) > 0.5 ||
      Math.abs(last.zoom - newViewport.zoom) > 1
    ) {
      fetchStations({ lat: newViewport.latitude, lng: newViewport.longitude }, newViewport.zoom, false);
    }
  }, [fetchStations]);

  // Search stations
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const vp = viewportRef.current;
      fetchStations({ lat: vp.latitude, lng: vp.longitude }, vp.zoom, true);
      return;
    }

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
          navigate('/submit', { state: { stationId, fuelTypeId } });
          setSelectedStation(null);
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
