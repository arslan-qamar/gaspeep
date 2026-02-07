import React, { useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
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
            {station.prices.length > 0 
              ? `$${Math.min(...station.prices.map((p) => p.price)).toFixed(2)}`
              : '?'}
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
