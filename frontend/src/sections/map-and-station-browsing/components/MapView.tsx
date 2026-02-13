import React, { useCallback, useMemo } from 'react';
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
  const handleMarkerClick = useCallback(
    (station: Station) => {
      onStationSelect(station);
    },
    [onStationSelect],
  );

  const selectedStation = useMemo(
    () => selectedStationId ? stations.find((s) => s.id === selectedStationId) : undefined,
    [stations, selectedStationId],
  );

  return (
    <Map
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
      <GeolocateControl
        position="top-right"
        trackUserLocation
        positionOptions={{ enableHighAccuracy: true }}
        showAccuracyCircle
      />
      <ScaleControl position="bottom-left" />

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
                ? 'bg-blue-600 shadow-lg scale-110'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {station.prices.length > 0
              ? `$${Math.min(...station.prices.map((p) => p.price)).toFixed(2)}`
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
