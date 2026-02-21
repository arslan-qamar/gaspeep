import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapViewGL, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station } from '../types';
import { Loader2 } from 'lucide-react';

const BRAND_ICON_BASE_PATHS = ['/icons-brand', '/icons-svg'];

const getBrandIconUrls = (brand: string | undefined): string[] => {
  if (!brand) return [];
  const encodedBrand = encodeURIComponent(brand);
  return BRAND_ICON_BASE_PATHS.map((basePath) => `${basePath}/${encodedBrand}.svg`);
};

const getLowestStationPrice = (station: Station): number | null => {
  if (!Array.isArray(station.prices) || station.prices.length === 0) return null;
  const validPrices = station.prices
    .map((priceEntry) => priceEntry.price)
    .filter((priceValue) => Number.isFinite(priceValue));
  if (validPrices.length === 0) return null;
  return Math.min(...validPrices);
};

const formatPriceInCents = (price: number): string => price.toFixed(1);

interface MapViewProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  selectedStationId?: string;
  userLocation?: { lat: number; lng: number };
  focusLocation?: { lat: number; lng: number; zoom?: number };
  onViewportChange?: (viewport: { latitude: number; longitude: number; zoom: number }) => void;
  isFetchingMore?: boolean;
}

export const MapView = React.forwardRef<HTMLDivElement, MapViewProps>(({
  stations,
  onStationSelect,
  selectedStationId,
  userLocation = { lat: 40.7128, lng: -74.006 },
  focusLocation,
  onViewportChange,
  isFetchingMore = false,
}, _ref) => {
  const mapRef = useRef<any>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [dimNonLowPriceBadges, setDimNonLowPriceBadges] = useState(false);
  const [iconLoadErrorCounts, setIconLoadErrorCounts] = useState<Record<string, number>>({});
  const getMapInstance = useCallback(() => {
    if (!mapRef.current) return null;
    if (typeof mapRef.current.getMap === 'function') return mapRef.current.getMap();
    if (typeof mapRef.current.flyTo === 'function') return mapRef.current;
    return null;
  }, []);

  const handleMarkerClick = useCallback(
    (station: Station) => {
      onStationSelect(station);
    },
    [onStationSelect],
  );

  const handleGeolocate = useCallback(() => {
    if (!mapRef.current) return;

    const map = getMapInstance();
    if (!map) return;

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Position acquired:', { latitude, longitude });

        // Animate map to the location
        map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
        });

        // Update parent component state
        onViewportChange?.({
          latitude,
          longitude,
          zoom: 14,
        });

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please check permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  }, [getMapInstance, onViewportChange]);

  const selectedStation = useMemo(
    () => selectedStationId ? stations.find((s) => s.id === selectedStationId) : undefined,
    [stations, selectedStationId],
  );

  const resetIdleBadgeTimer = useCallback(() => {
    setDimNonLowPriceBadges(false);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      setDimNonLowPriceBadges(true);
    }, 2000);
  }, []);

  const { stationLowestPriceById, lowPriceThreshold, highPriceThreshold } = useMemo(() => {
    const lowestPriceById = new Map<string, number>();
    const allLowestPrices: number[] = [];

    for (const station of stations) {
      const lowestPrice = getLowestStationPrice(station);
      if (lowestPrice === null) continue;
      lowestPriceById.set(station.id, lowestPrice);
      allLowestPrices.push(lowestPrice);
    }

    if (allLowestPrices.length === 0) {
      return {
        stationLowestPriceById: lowestPriceById,
        lowPriceThreshold: null,
        highPriceThreshold: null,
      };
    }

    const minPrice = Math.min(...allLowestPrices);
    const maxPrice = Math.max(...allLowestPrices);

    if (minPrice === maxPrice) {
      return {
        stationLowestPriceById: lowestPriceById,
        lowPriceThreshold: minPrice,
        highPriceThreshold: maxPrice,
      };
    }

    const spread = maxPrice - minPrice;
    return {
      stationLowestPriceById: lowestPriceById,
      lowPriceThreshold: minPrice + spread / 3,
      highPriceThreshold: minPrice + (2 * spread) / 3,
    };
  }, [stations]);

  useEffect(() => {
    if (!focusLocation || !mapRef.current) return;

    const map = getMapInstance();
    if (!map) return;

    map.flyTo({
      center: [focusLocation.lng, focusLocation.lat],
      zoom: focusLocation.zoom ?? 15,
      duration: 600,
    });
  }, [focusLocation, getMapInstance]);

  useEffect(() => {
    resetIdleBadgeTimer();
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleBadgeTimer]);

  return (
    <MapViewGL
      ref={mapRef}
      initialViewState={{
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        zoom: 14,
      }}
      onMove={resetIdleBadgeTimer}
      onMoveEnd={(evt) => {
        resetIdleBadgeTimer();
        onViewportChange?.({
          latitude: evt.viewState.latitude,
          longitude: evt.viewState.longitude,
          zoom: evt.viewState.zoom,
        });
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      {/* Navigation Controls */}
      <NavigationControl position="top-right" showCompass showZoom />
      <FullscreenControl position="top-right" />     
      <ScaleControl position="bottom-left" />

      {/* Custom Geolocate Button */}
      <div className=" maplibregl-ctrl-group absolute bottom-[10px] right-2 z-20">
        <button
          onClick={handleGeolocate}
          disabled={isLocating}
          className="maplibregl-ctrl-fullscreen"
          title="Go to current location"
          aria-label="Go to current location"
          type="button"
        >
          <span className="maplibregl-ctrl-icon" aria-hidden="true">
            {isLocating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.5 2C9.03 2 4.5 6.53 4.5 12c0 6.5 10 15 10 15s10-8.5 10-15c0-5.47-4.53-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#3B82F6"/>
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isFetchingMore && (
        <div className="absolute top-4 right-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 z-10">
          <Loader2 size={16} className="animate-spin text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Loading stations...</span>
        </div>
      )}

      {/* User Location */}
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        </Marker>
      )}

      {/* Stations */}
      {stations
        .filter((station) => typeof station.latitude === 'number' && typeof station.longitude === 'number')
        .map((station) => {
          const stationIconKey = `${station.id}:${station.brand ?? ''}`;
          const iconUrls = getBrandIconUrls(station.brand);
          const iconErrorCount = iconLoadErrorCounts[stationIconKey] ?? 0;
          const iconUrl = iconUrls[iconErrorCount] ?? null;
          const showIcon = Boolean(iconUrl);
          const lowestPrice = stationLowestPriceById.get(station.id);

          let badgeClassName = 'bg-gray-400';
          let badgeBucket: 'low' | 'mid' | 'high' | 'none' = 'none';
          let badgeTitle = 'No price data available';
          if (typeof lowestPrice === 'number' && lowPriceThreshold !== null && highPriceThreshold !== null) {
            if (lowestPrice <= lowPriceThreshold) {
              badgeClassName = 'bg-green-500';
              badgeBucket = 'low';
              badgeTitle = 'Lower-end price';
            } else if (lowestPrice >= highPriceThreshold) {
              badgeClassName = 'bg-red-500';
              badgeBucket = 'high';
              badgeTitle = 'Higher-end price';
            } else {
              badgeClassName = 'bg-yellow-500';
              badgeBucket = 'mid';
              badgeTitle = 'Median-range price';
            }
          }
          const badgeColorClassName =
            dimNonLowPriceBadges && (badgeBucket === 'mid' || badgeBucket === 'high')
              ? 'bg-gray-400'
              : badgeClassName;

          return (
            <Marker
              key={station.id}
              longitude={station.longitude}
              latitude={station.latitude}
              onClick={() => handleMarkerClick(station)}
            >
              <div className="relative">
                {/* Brand Icon */}
              <button
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all cursor-pointer shadow-md border-2 border-white ${
                  selectedStationId === station.id
                    ? 'scale-125 ring-2 ring-blue-500'
                    : 'hover:scale-110'
                }`}

                title={station.brand || 'Gas Station'}
              >
                {showIcon ? (
                  <img
                    src={iconUrl!}
                    alt={station.brand || 'Gas Station'}
                    className="w-8 h-8"
                    loading="lazy"
                    onError={() =>
                      setIconLoadErrorCounts((prev) => ({
                        ...prev,
                        [stationIconKey]: iconErrorCount + 1,
                      }))
                    }
                  />
                ) : (
                  <span>⛽</span>
                )}
              </button>
                {/* Price Badge */}
                {typeof lowestPrice === 'number' ? (
                  <div
                    className={`absolute -bottom-2 -right-2 ${badgeColorClassName} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-white`}
                    title={badgeTitle}
                  >
                    {formatPriceInCents(lowestPrice)}
                  </div>
                ) : (
                  <div
                    className={`absolute -bottom-2 -right-2 ${badgeColorClassName} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-white`}
                    title="No price data available"
                  >
                    ?
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

      {/* Popup for selected station */}
      {selectedStation && (
        <Popup
          longitude={selectedStation.longitude}
          latitude={selectedStation.latitude}
          closeButton={false}
          closeOnClick={false}
        >
          <div className="p-2">
            <p className="font-bold text-sm">{selectedStation.name}</p>
            <p className="text-xs text-slate-600">Click for details</p>
          </div>
        </Popup>
      )}
    </MapViewGL>
  );
});

MapView.displayName = 'MapView';

export default MapView;
