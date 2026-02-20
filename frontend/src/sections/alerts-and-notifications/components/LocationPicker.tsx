import React, { useState, useCallback, useRef, useMemo, useEffect, type ReactNode } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Loader, Search, X } from 'lucide-react';

interface LocationPickerProps {
  value: { address: string; latitude: number; longitude: number } | null;
  onChange: (location: { address: string; latitude: number; longitude: number } | null) => void;
  radiusKm?: number;
  infoContent?: ReactNode;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const SYDNEY_DEFAULT = { lat: -33.8688, lng: 151.2093 };
const MAX_VISUAL_RADIUS_KM = 30;

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  radiusKm = 5,
  infoContent,
}) => {
  const mapRef = useRef<any>(null);
  const hasStartedInitializationRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(
    value ? { lat: value.latitude, lng: value.longitude } : SYDNEY_DEFAULT
  );

  const fitMapToRadius = useCallback((lat: number, lng: number, km: number) => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap?.();
    if (!map) return;

    // Keep the map readable at high monitoring radii while preserving
    // the actual alert radius value for backend filtering.
    const visualRadiusKm = Math.min(km, MAX_VISUAL_RADIUS_KM);
    const latOffset = visualRadiusKm / 111;
    const lngOffset = visualRadiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    map.fitBounds(
      [
        [lng - lngOffset, lat - latOffset],
        [lng + lngOffset, lat + latOffset],
      ],
      {
        padding: 40,
        duration: 600,
        maxZoom: 15,
      }
    );
  }, []);

  useEffect(() => {
    if (!value) return;
    setMarkerPosition({ lat: value.latitude, lng: value.longitude });
  }, [value]);

  useEffect(() => {
    fitMapToRadius(markerPosition.lat, markerPosition.lng, radiusKm);
  }, [markerPosition.lat, markerPosition.lng, radiusKm, fitMapToRadius]);

  useEffect(() => {
    if (value || hasInitializedLocation || hasStartedInitializationRef.current) return;
    hasStartedInitializationRef.current = true;

    const applySydneyFallback = () => {
      onChange({
        address: 'Sydney NSW, Australia',
        latitude: SYDNEY_DEFAULT.lat,
        longitude: SYDNEY_DEFAULT.lng,
      });
      setHasInitializedLocation(true);
    };

    if (!navigator.geolocation) {
      applySydneyFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(
            `${NOMINATIM_API}/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data: NominatimResult = await response.json();
          onChange({
            address: data.display_name,
            latitude,
            longitude,
          });
        } catch (_err) {
          onChange({
            address: 'Current Location',
            latitude,
            longitude,
          });
        } finally {
          setHasInitializedLocation(true);
        }
      },
      () => {
        applySydneyFallback();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [value, hasInitializedLocation, onChange]);

  // Debounced geocoding search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${NOMINATIM_API}/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const results: NominatimResult[] = await response.json();
      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      console.error('Geocoding search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => performSearch(query), 400);
    };
  }, [performSearch]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSelectResult = async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPosition({ lat, lng });
    onChange({
      address: result.display_name,
      latitude: lat,
      longitude: lng,
    });
    setSearchQuery('');
    setShowResults(false);

    // Animate map to selected location
    if (mapRef.current) {
      fitMapToRadius(lat, lng, radiusKm);
    }
  };

  const handleMapClick = async (e: any) => {
    const { lng, lat } = e.lngLat;
    setMarkerPosition({ lat, lng });

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `${NOMINATIM_API}/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data: NominatimResult = await response.json();
      onChange({
        address: data.display_name,
        latitude: lat,
        longitude: lng,
      });
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      // Still set location even if reverse geocoding fails
      onChange({
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const handleMarkerDragEnd = async (e: any) => {
    const { lng, lat } = e.lngLat;
    setMarkerPosition({ lat, lng });

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `${NOMINATIM_API}/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data: NominatimResult = await response.json();
      onChange({
        address: data.display_name,
        latitude: lat,
        longitude: lng,
      });
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      onChange({
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `${NOMINATIM_API}/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data: NominatimResult = await response.json();
          onChange({
            address: data.display_name,
            latitude,
            longitude,
          });
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          onChange({
            address: 'Current Location',
            latitude,
            longitude,
          });
        }

        // Animate map to current location
        fitMapToRadius(latitude, longitude, radiusKm);

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get current location. Please enter manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
          {isSearching ? (
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
          ) : searchQuery ? (
            <button
              onClick={handleClearSearch}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white truncate">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {infoContent}

      {/* Map Container - Always Visible */}
      <div className="h-56 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: markerPosition.lat,
            longitude: markerPosition.lng,
            zoom: 14,
          }}
          onLoad={() => {
            fitMapToRadius(markerPosition.lat, markerPosition.lng, radiusKm);
          }}
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
          {/* Current Location Control */}
          <div className="maplibregl-ctrl-group absolute bottom-[10px] right-2 z-20">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="maplibregl-ctrl-fullscreen"
              title="Go to current location"
              aria-label="Go to current location"
              type="button"
            >
              <span className="maplibregl-ctrl-icon" aria-hidden="true">
                {isLocating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.5 2C9.03 2 4.5 6.53 4.5 12c0 6.5 10 15 10 15s10-8.5 10-15c0-5.47-4.53-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#3B82F6"/>
                  </svg>
                )}
              </span>
            </button>
          </div>

          <Marker
            longitude={markerPosition.lng}
            latitude={markerPosition.lat}
            draggable
            onDragEnd={handleMarkerDragEnd}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-grab active:cursor-grabbing border-2 border-white">
              <MapPin className="w-4 h-4" />
            </div>
          </Marker>
        </Map>
      </div>

      {/* Selected Location Display */}
      {value && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Selected Location</p>
          <p className="text-sm text-slate-900 dark:text-white break-words">
            {value.address}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
};
