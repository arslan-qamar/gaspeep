import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown } from 'lucide-react';
import MapView from '../components/MapView';
import StationDetailSheet from '../components/StationDetailSheet';
import { PriceSubmissionForm } from '../../price-submission-system/PriceSubmissionForm';
import { Station } from '../types';
import { calculateDistance, getRadiusFromZoom } from '../../../lib/utils';
import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { searchStationsNearby } from '../../../services/stationsService'
import { fuelTypeApi, brandApi, mapPreferencesApi, type MapFilterPreferences } from '@/lib/api';

const DEFAULT_MAX_PRICE_CENTS = 400;
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const DEFAULT_FILTERS: FilterState = {
  fuelTypes: [],
  maxPrice: DEFAULT_MAX_PRICE_CENTS,
  onlyVerified: false,
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

interface FilterState {
  fuelTypes: string[];
  maxPrice: number;
  onlyVerified: boolean;
}

interface FuelTypeOption {
  id: string;
  label: string;
}

interface MultiSelectDropdownOption {
  id: string;
  label: string;
}

interface MultiSelectDropdownProps {
  title: string;
  options: MultiSelectDropdownOption[];
  selectedValues: string[];
  onToggleValue: (value: string) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  title,
  options,
  selectedValues,
  onToggleValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(`[data-dropdown-root="${title}"]`)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen, title]);

  const selectedCount = selectedValues.length;
  const triggerText = selectedCount > 0 ? `${title} (${selectedCount} selected)` : title;

  return (
    <div className="space-y-2 min-w-[160px]" data-dropdown-root={title}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full rounded-xl border border-white/35 dark:border-white/15 bg-transparent backdrop-blur-md px-3 py-2.5 text-left text-sm font-medium text-slate-900 dark:text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.18)] min-h-11 flex items-center justify-between"
      >
        <span>{triggerText}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="rounded-xl border border-white/35 dark:border-white/15 bg-transparent backdrop-blur-xl shadow-[0_16px_40px_rgba(15,23,42,0.3)] p-2"
          role="menu"
          aria-label={`${title} options`}
        >
          {options.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {options.map((option) => {
                const checked = selectedSet.has(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer hover:bg-transparent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleValue(option.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 px-2 py-2">No options available</p>
          )}
        </div>
      )}
    </div>
  );
};

const areFiltersEqual = (a: FilterState, b: FilterState): boolean => (
  a.maxPrice === b.maxPrice &&
  a.onlyVerified === b.onlyVerified &&
  a.fuelTypes.length === b.fuelTypes.length &&
  a.fuelTypes.every((fuelType) => b.fuelTypes.includes(fuelType))
);

const areStringArraysEqual = (a: string[], b: string[]): boolean => (
  a.length === b.length && a.every((value) => b.includes(value))
);

const sanitizeFilters = (value: Partial<FilterState> | null | undefined): FilterState => ({
  fuelTypes: Array.isArray(value?.fuelTypes)
    ? value.fuelTypes.filter((fuelType): fuelType is string => typeof fuelType === 'string')
    : [],
  maxPrice: typeof value?.maxPrice === 'number' && Number.isFinite(value.maxPrice)
    ? Math.min(Math.max(value.maxPrice, 0), DEFAULT_MAX_PRICE_CENTS)
    : DEFAULT_MAX_PRICE_CENTS,
  onlyVerified: Boolean(value?.onlyVerified),
});

const sanitizeBrands = (value: unknown): string[] => (
  Array.isArray(value)
    ? value.filter((brand): brand is string => typeof brand === 'string')
    : []
);

const normalizeBrand = (brand: string | null | undefined): string => (
  typeof brand === 'string' ? brand.trim().toLowerCase() : ''
);

export const MapPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; zoom?: number } | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitOverlayOpen = searchParams.get('overlay') === 'submit';

  // Refs — use refs for values only needed in callbacks/effects, not in render
  const lastFetchLocation = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const viewportRef = useRef<{ latitude: number; longitude: number; zoom: number } | null>(null);
  const prevFiltersRef = useRef(filters);
  const prevSelectedBrandsRef = useRef(selectedBrands);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextFilterSaveRef = useRef(false);
  const skipNextBrandSaveRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Params for the current fetch — updating this triggers the React Query fetch
  const [fetchParams, setFetchParams] = useState<{
    lat: number
    lng: number
    zoom: number
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
    queryKey: ['stations', fetchParams, filters],
    queryFn: async ({ signal }) => {
      if (!fetchParams) return [] as Station[]

      const radius = getRadiusFromZoom(fetchParams.zoom)

      // Use unified /search-nearby endpoint for both browse and search modes
      // (query parameter is optional - when empty, behaves like /nearby)
      return searchStationsNearby({
        latitude: fetchParams.lat,
        longitude: fetchParams.lng,
        radiusKm: radius,
        fuelTypes: filters.fuelTypes.length > 0 ? filters.fuelTypes : undefined,
        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
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
  const { data: savedPreferences, isLoading: loadingSavedFilters } = useQuery<MapFilterPreferences>({
    queryKey: ['map-filter-preferences'],
    queryFn: async () => {
      const response = await mapPreferencesApi.getMapFilterPreferences()
      const data = response?.data
      return {
        ...sanitizeFilters(data),
        brands: sanitizeBrands(data?.brands),
      }
    },
    staleTime: 5 * 60_000,
  })
  const saveFiltersMutation = useMutation({
    mutationFn: async (nextPreferences: MapFilterPreferences) => {
      return mapPreferencesApi.updateMapFilterPreferences(nextPreferences)
    },
  })

  useEffect(() => {
    if (preferencesHydrated) return
    if (loadingSavedFilters) return

    const nextFilters = sanitizeFilters(savedPreferences)
    if (!areFiltersEqual(filters, nextFilters)) {
      skipNextFilterSaveRef.current = true
      setFilters(nextFilters)
    }
    const nextBrands = sanitizeBrands(savedPreferences?.brands)
    if (!areStringArraysEqual(selectedBrands, nextBrands)) {
      skipNextBrandSaveRef.current = true
      setSelectedBrands(nextBrands)
    }
    setPreferencesHydrated(true)
  }, [loadingSavedFilters, savedPreferences, filters, selectedBrands, preferencesHydrated])

    // Ensure fetchedStations are reflected into local `stations` state. This
    // duplicates onSuccess safety and guards against cases where the query
    // resolves but onSuccess didn't run (e.g. during strict mode re-renders).
    useEffect(() => {
      if (!fetchParams || !fetchedStations) return

      const newStations = fetchedStations as Station[]

      if (fetchParams.clearExisting && newStations.length === 0) {
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
    }, [fetchedStations, fetchParams])

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
    if (!preferencesHydrated) return;
    if (!userLocation) return;
    viewportRef.current = { latitude: userLocation.lat, longitude: userLocation.lng, zoom: 14 };
    setFetchParams({ lat: userLocation.lat, lng: userLocation.lng, zoom: 14, clearExisting: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, preferencesHydrated]);

  // Re-fetch when filters change (skip initial render via reference comparison)
  useEffect(() => {
    if (prevFiltersRef.current === filters) return;
    prevFiltersRef.current = filters;
    if (!preferencesHydrated) return;

    if (skipNextFilterSaveRef.current) {
      skipNextFilterSaveRef.current = false
    } else {
      saveFiltersMutation.mutate({ ...filters, brands: selectedBrands })
    }

    const vp = viewportRef.current ?? (userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng, zoom: 14 } : null);
    if (!vp) return;

    setFetchParams({ lat: vp.latitude, lng: vp.longitude, zoom: vp.zoom, clearExisting: true });
  }, [filters, selectedBrands, userLocation, preferencesHydrated, saveFiltersMutation]);

  useEffect(() => {
    if (areStringArraysEqual(prevSelectedBrandsRef.current, selectedBrands)) return;
    prevSelectedBrandsRef.current = selectedBrands;
    if (!preferencesHydrated) return;

    if (skipNextBrandSaveRef.current) {
      skipNextBrandSaveRef.current = false;
      return;
    }

    saveFiltersMutation.mutate({ ...filters, brands: selectedBrands });
  }, [selectedBrands, filters, preferencesHydrated, saveFiltersMutation]);

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
      setFetchParams({ lat: newViewport.latitude, lng: newViewport.longitude, zoom: newViewport.zoom, clearExisting: false });
    }
  }, []);

  const { data: brandOptions = [] } = useQuery<string[]>({
    queryKey: ['brand-filter-options'],
    queryFn: async () => {
      const response = await brandApi.getBrands()
      const brands = response?.data ?? []
      return brands
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((brand) => brand.displayName || brand.name)
    },
    staleTime: 10 * 60_000,
  })

  const visibleStations = useMemo(() => {
    if (selectedBrands.length === 0) return stations;
    const selectedBrandSet = new Set(selectedBrands.map(normalizeBrand));
    return stations.filter((station) => selectedBrandSet.has(normalizeBrand(station.brand)));
  }, [stations, selectedBrands]);

  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (trimmedQuery.length < 2) {
      setLocationResults([]);
      setLocationSearchError(null);
      setIsSearchingLocations(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingLocations(true);
    setLocationSearchError(null);

    fetch(`${NOMINATIM_API}/search?q=${encodeURIComponent(trimmedQuery)}&format=json&limit=5`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Location search unavailable');
        }
        return response.json();
      })
      .then((results: NominatimResult[]) => {
        setLocationResults(Array.isArray(results) ? results.slice(0, 5) : []);
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        setLocationResults([]);
        setLocationSearchError('Location search unavailable');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearchingLocations(false);
        }
      });

    return () => controller.abort();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setHighlightedIndex(locationResults.length > 0 ? 0 : -1);
  }, [locationResults]);

  const handleSelectLocation = useCallback((result: NominatimResult) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const zoom = viewportRef.current?.zoom ?? 14;
    viewportRef.current = { latitude: lat, longitude: lng, zoom };
    setFocusLocation({ lat, lng, zoom });
    setSearchQuery(result.display_name);
    setIsSearchOpen(false);
    setLocationResults([]);
    setHighlightedIndex(-1);
    setFetchParams({ lat, lng, zoom, clearExisting: true });
  }, []);

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
    setLocationResults([]);
    setLocationSearchError(null);
    setIsSearchOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || locationResults.length === 0) {
      if (event.key === 'ArrowDown' && locationResults.length > 0) {
        event.preventDefault();
        setIsSearchOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % locationResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? locationResults.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = locationResults[highlightedIndex];
      if (!selected) return;
      handleSelectLocation(selected);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsSearchOpen(false);
    }
  };

  const handleFuelTypeToggle = (fuelTypeId: string) => {
    setFilters((previous) => ({
      ...previous,
      fuelTypes: previous.fuelTypes.includes(fuelTypeId)
        ? previous.fuelTypes.filter((value) => value !== fuelTypeId)
        : [...previous.fuelTypes, fuelTypeId],
    }));
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((previous) => (
      previous.includes(brand)
        ? previous.filter((value) => value !== brand)
        : [...previous, brand]
    ));
  };

  const closeSubmitOverlay = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('overlay');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isSubmitOverlayOpen) return;

    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSubmitOverlay();
      }
    };

    document.addEventListener('keydown', handleEscapeClose);
    return () => {
      document.removeEventListener('keydown', handleEscapeClose);
    };
  }, [isSubmitOverlayOpen, closeSubmitOverlay]);

  return (
    <div className="w-full h-full relative">
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
          Loading stations...
        </div>
      )}

      {/* Map */}
      <div className="w-full h-full">
        {userLocation ? (
          <MapView
            stations={visibleStations}
            selectedStationId={selectedStation?.id}
            onStationSelect={setSelectedStation}
            userLocation={userLocation}
            focusLocation={focusLocation}
            onViewportChange={handleViewportChange}
            isFetchingMore={isFetchingMore}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
            Locating you...
          </div>
        )}
      </div>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-5xl pointer-events-none">
        <div ref={searchContainerRef} className="pointer-events-auto relative">
          <div className="flex items-center gap-2 bg-transparent border border-white/35 dark:border-white/10 px-3 rounded-lg backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
            <Search size={20} className="text-slate-600 dark:text-slate-300" />
            <input
              type="text"
              placeholder="Search location"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="flex-1 bg-transparent py-2 outline-none text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-300"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="p-1 hover:bg-transparent rounded transition-colors"
                aria-label="Clear search"
              >
                <X size={18} className="text-slate-700 dark:text-slate-200" />
              </button>
            )}
          </div>
          {isSearchOpen && (
            <div
              data-testid="map-unified-search-dropdown"
              className="absolute mt-2 w-full rounded-lg border border-white/35 dark:border-white/10 bg-transparent backdrop-blur-xl shadow-[0_16px_40px_rgba(15,23,42,0.35)] z-30 max-h-80 overflow-y-auto"
            >
              <div className="px-3 py-2 border-b border-white/30 dark:border-white/10 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Locations
              </div>
              {isSearchingLocations && (
                <div className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">Searching locations...</div>
              )}
              {!isSearchingLocations && locationSearchError && (
                <div className="px-3 py-2 text-sm text-rose-500">{locationSearchError}</div>
              )}
              {!isSearchingLocations && !locationSearchError && locationResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">Type at least 2 characters</div>
              )}
              {locationResults.map((result, index) => (
                <button
                  key={`${result.lat}:${result.lon}:${result.display_name}`}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-transparent ${
                    highlightedIndex === index ? 'bg-transparent' : ''
                  }`}
                  onClick={() => handleSelectLocation(result)}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(200px,1fr)_minmax(200px,1fr)_minmax(200px,1fr)] gap-3">
          <div className="pointer-events-auto">
            <MultiSelectDropdown
              title="Fuel Types"
              options={fuelTypeOptions.map((fuelType) => ({ id: fuelType.id, label: fuelType.label }))}
              selectedValues={filters.fuelTypes}
              onToggleValue={handleFuelTypeToggle}
            />
          </div>
          <div className="pointer-events-auto">
            <MultiSelectDropdown
              title="Brands"
              options={brandOptions.map((brand) => ({ id: brand, label: brand }))}
              selectedValues={selectedBrands}
              onToggleValue={handleBrandToggle}
            />
          </div>
          <div className="pointer-events-auto rounded-xl border border-white/35 dark:border-white/15 bg-transparent backdrop-blur-md px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.18)] min-h-11">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Max Price: {filters.maxPrice.toFixed(1)}¢/L
            </label>
            <input
              type="range"
              min={0}
              max={400}
              step={0.1}
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((previous) => ({
                  ...previous,
                  maxPrice: parseFloat(e.target.value),
                }))
              }
              className="w-full mt-1"
            />
            <label className="mt-1.5 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={filters.onlyVerified}
                onChange={(e) =>
                  setFilters((previous) => ({
                    ...previous,
                    onlyVerified: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded"
              />
              Show verified prices only
            </label>
          </div>
        </div>
      </div>

      {/* Station Detail Sheet */}
      <StationDetailSheet
        station={selectedStation}
        isOpen={!!selectedStation}
        onClose={() => setSelectedStation(null)}
        onSubmitPrice={(stationId, fuelTypeId) => {
          navigate('/map?overlay=submit', { state: { stationId, fuelTypeId } });
          setSelectedStation(null);
        }}
      />

      {isSubmitOverlayOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative h-full overflow-y-auto">
            <div className="sticky top-0 z-10 flex justify-end p-3">
              <button
                type="button"
                onClick={closeSubmitOverlay}
                aria-label="Close submit overlay"
                className="pointer-events-auto rounded-lg p-2 text-white/80 hover:text-white hover:bg-transparent transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-3 pb-3 max-w-xl mx-auto rounded-xl overflow-hidden shadow-lg bg-slate-50  dark:bg-slate-800">
              <PriceSubmissionForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
