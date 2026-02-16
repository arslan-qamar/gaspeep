import React, { useCallback, useMemo, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station } from '../types';
import { Loader2 } from 'lucide-react';

interface MapViewProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  selectedStationId?: string;
  userLocation?: { lat: number; lng: number };
  onViewportChange?: (viewport: { latitude: number; longitude: number; zoom: number }) => void;
  isFetchingMore?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  stations,
  onStationSelect,
  selectedStationId,
  userLocation = { lat: 40.7128, lng: -74.006 },
  onViewportChange,
  isFetchingMore = false,
}) => {
  const mapRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleMarkerClick = useCallback(
    (station: Station) => {
      onStationSelect(station);
    },
    [onStationSelect],
  );

  const handleGeolocate = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
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
  }, [onViewportChange]);

  const selectedStation = useMemo(
    () => selectedStationId ? stations.find((s) => s.id === selectedStationId) : undefined,
    [stations, selectedStationId],
  );

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        zoom: 14,
      }}
      onMoveEnd={(evt) => {
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
        .map((station) => (
          <Marker
            key={station.id}
            longitude={station.longitude}
            latitude={station.latitude}
            onClick={() => handleMarkerClick(station)}
          >
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all cursor-pointer ${
                selectedStationId === station.id
                  ? 'bg-blue-600 shadow-lg scale-110'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {Array.isArray(station.prices) && station.prices.length > 0
                ? `$${Math.min(...station.prices.map((p) => (typeof p.price === 'number' ? p.price : Infinity))).toFixed(2)}`
                : '?'}
            </button>
          </Marker>
        ))}

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
    </Map>
  );
};

export default MapView;
