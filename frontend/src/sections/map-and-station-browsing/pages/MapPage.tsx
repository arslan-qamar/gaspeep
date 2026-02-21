import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import MapView from '../components/MapView';
import StationDetailSheet from '../components/StationDetailSheet';
import FilterModal, { FuelTypeOption, FilterState } from '../components/FilterModal';
import { Station } from '../types';
import { calculateDistance, getRadiusFromZoom } from '../../../lib/utils';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { searchStationsNearby } from '../../../services/stationsService'
import { fuelTypeApi } from '@/lib/api';

export const MapPage: React.FC = () => {
  const DEFAULT_MAX_PRICE_CENTS = 400;
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    fuelTypes: [],
    maxPrice: DEFAULT_MAX_PRICE_CENTS,
    onlyVerified: false,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const navigate = useNavigate();

  // Refs — use refs for values only needed in callbacks/effects, not in render
  const lastFetchLocation = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const viewportRef = useRef<{ latitude: number; longitude: number; zoom: number } | null>(null);
  const prevFiltersRef = useRef(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Params for the current fetch — updating this triggers the React Query fetch
  const [fetchParams, setFetchParams] = useState<{
    lat: number
    lng: number
    zoom: number
    searchQuery?: string
    clearExisting?: boolean
  } | null>(null)

  // Debounce search query
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Use React Query to fetch stations; this improves deduplication and caching.
  const queryOptions: UseQueryOptions<Station[], Error, Station[]> = {
    queryKey: ['stations', fetchParams, filters, debouncedSearchQuery],
    queryFn: async ({ signal }) => {
      if (!fetchParams) return [] as Station[]

      const radius = getRadiusFromZoom(fetchParams.zoom)

      // Use unified /search-nearby endpoint for both browse and search modes
      // (query parameter is optional - when empty, behaves like /nearby)
      return searchStationsNearby({
        latitude: fetchParams.lat,
        longitude: fetchParams.lng,
        radiusKm: radius,
        query: debouncedSearchQuery || undefined,
        fuelTypes: filters.fuelTypes.length > 0 ? filters.fuelTypes : undefined,
        maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined,
      }, signal) as Promise<Station[]>
    },
    enabled: !!fetchParams,
    staleTime: 60_000,
    // onSuccess handling moved into a separate useEffect below to keep
    // query options compatible with v5 TypeScript definitions.
  }

  const { data: fetchedStations, isFetching } = useQuery(queryOptions)
  const { data: fuelTypeOptions = [] } = useQuery<FuelTypeOption[]>({
    queryKey: ['fuel-types-filter-options'],
    queryFn: async () => {
      const response = await fuelTypeApi.getFuelTypes()
      const fuelTypes = response?.data ?? []
      return fuelTypes
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((fuelType) => ({
          id: fuelType.id,
          label: fuelType.displayName || fuelType.name,
        }))
    },
    staleTime: 10 * 60_000,
  })

    // Ensure fetchedStations are reflected into local `stations` state. This
    // duplicates onSuccess safety and guards against cases where the query
    // resolves but onSuccess didn't run (e.g. during strict mode re-renders).
    useEffect(() => {
      if (!fetchParams || !fetchedStations) return

      const newStations = fetchedStations as Station[]

      if (debouncedSearchQuery && debouncedSearchQuery.trim() && newStations.length === 0) {
        setStations(newStations)
        return
      }

      if (newStations.length > 0) {
        if (fetchParams.clearExisting) {
          setStations(newStations)
        } else {
          setStations((prevStations) => {
            const stationsMap = new Map<string, Station>()
            prevStations.forEach((station) => stationsMap.set(station.id, station))
            newStations.forEach((station: Station) => stationsMap.set(station.id, station))

            return Array.from(stationsMap.values())
              .map((station) => ({
                station,
                distance: calculateDistance(
                  fetchParams.lat, fetchParams.lng,
                  station.latitude, station.longitude
                ),
              }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 200)
              .map((item) => item.station)
          })
        }
      }
      lastFetchLocation.current = { lat: fetchParams.lat, lng: fetchParams.lng, zoom: fetchParams.zoom }
    }, [fetchedStations, fetchParams, debouncedSearchQuery])

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

  // Initial load/geolocation resolution.
  useEffect(() => {
    if (!userLocation) return;
    viewportRef.current = { latitude: userLocation.lat, longitude: userLocation.lng, zoom: 14 };
    setFetchParams({ lat: userLocation.lat, lng: userLocation.lng, zoom: 14, searchQuery: debouncedSearchQuery, clearExisting: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Re-fetch against the current viewport when the debounced search query changes.
  useEffect(() => {
    if (!userLocation) return;

    const vp = viewportRef.current ?? { latitude: userLocation.lat, longitude: userLocation.lng, zoom: 14 };
    setFetchParams({
      lat: vp.latitude,
      lng: vp.longitude,
      zoom: vp.zoom,
      searchQuery: debouncedSearchQuery,
      clearExisting: true,
    });
  }, [debouncedSearchQuery, userLocation]);

  // Re-fetch when filters change (skip initial render via reference comparison)
  useEffect(() => {
    if (prevFiltersRef.current === filters) return;
    prevFiltersRef.current = filters;

    const vp = viewportRef.current ?? (userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng, zoom: 14 } : null);
    if (!vp) return;

    setFetchParams({ lat: vp.latitude, lng: vp.longitude, zoom: vp.zoom, searchQuery: debouncedSearchQuery, clearExisting: true });
  }, [filters, userLocation, debouncedSearchQuery]);

  // Reflect React Query's fetching state into local loading flags for UI
  useEffect(() => {
    if (!fetchParams) return
    if (isFetching) {
      if (fetchParams.clearExisting) setLoading(true)
      else setIsFetchingMore(true)
    } else {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }, [isFetching, fetchParams])

  // Handle map move end — called once when the user stops panning/zooming
  const handleViewportChange = useCallback((newViewport: { latitude: number; longitude: number; zoom: number }) => {
    viewportRef.current = newViewport;

    const last = lastFetchLocation.current;
    if (
      !last ||
      calculateDistance(last.lat, last.lng, newViewport.latitude, newViewport.longitude) > 0.5 ||
      Math.abs(last.zoom - newViewport.zoom) > 1
    ) {
      setFetchParams({ lat: newViewport.latitude, lng: newViewport.longitude, zoom: newViewport.zoom, searchQuery: debouncedSearchQuery, clearExisting: false });
    }
  }, [debouncedSearchQuery]);

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 rounded-lg">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Filter stations by name e.g: Shell, BP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent py-2 outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Clear search"
            >
              <X size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          )}
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
        {userLocation ? (
          <MapView
            stations={stations}
            selectedStationId={selectedStation?.id}
            onStationSelect={setSelectedStation}
            userLocation={userLocation}
            onViewportChange={handleViewportChange}
            isFetchingMore={isFetchingMore}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
            Locating you...
          </div>
        )}
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
        fuelTypeOptions={fuelTypeOptions}
        onFiltersChange={setFilters}
        onClose={() => setFilterModalOpen(false)}
      />
    </div>
  );
};

export default MapPage;
