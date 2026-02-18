import React, { useMemo } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface StationLocationMapProps {
  latitude: number;
  longitude: number;
  stationName: string;
  monitoringRadiusKm?: number;
}

/**
 * Helper function to create a circle GeoJSON from lat/lng and radius in km
 * Uses the Haversine formula to generate points along the circle
 */
const createCircleGeoJSON = (lat: number, lng: number, radiusKm: number, points = 64) => {
  const coordinates = [];
  const earthRadiusKm = 6371;

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * (Math.PI * 2);
    const dx = radiusKm * Math.cos(angle) / earthRadiusKm;
    const dy = radiusKm * Math.sin(angle) / earthRadiusKm;

    const lat2 = lat + (dy * 180) / Math.PI;
    const lng2 = lng + (dx * 180) / (Math.PI * Math.cos((lat * Math.PI) / 180));

    coordinates.push([lng2, lat2]);
  }
  // Close the circle
  coordinates.push(coordinates[0]);

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coordinates],
    },
  };
};

/**
 * StationLocationMap
 * A compact, interactive map that displays a single station's location with a marker.
 * Used in StationDetailsScreen to show the geographic location of a claimed station.
 * Optionally displays a monitoring radius circle (default 30 km).
 */
export const StationLocationMap: React.FC<StationLocationMapProps> = ({
  latitude,
  longitude,
  stationName,
  monitoringRadiusKm = 30,
}) => {
  const radiusGeoJSON = useMemo(
    () => createCircleGeoJSON(latitude, longitude, monitoringRadiusKm),
    [latitude, longitude, monitoringRadiusKm]
  );

  return (
    <Map
      initialViewState={{
        latitude,
        longitude,
        zoom: 12,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      interactive={true}
    >
      <NavigationControl position="top-right" showCompass={false} showZoom />

      {/* Monitoring Radius Circle */}
      <Source id="radius-source" type="geojson" data={radiusGeoJSON}>
        <Layer
          id="radius-fill"
          type="fill"
          paint={{
            'fill-color': '#3b82f6',
            'fill-opacity': 0.1,
          }}
        />
        <Layer
          id="radius-outline"
          type="line"
          paint={{
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-opacity': 0.6,
            'line-dasharray': [5, 5],
          }}
        />
      </Source>

      {/* Station Marker */}
      <Marker latitude={latitude} longitude={longitude}>
        <div
          aria-label={stationName}
          className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          title={stationName}
        >
          <span role="img" aria-hidden="true">⛽</span>
        </div>
      </Marker>
    </Map>
  );
};

export default StationLocationMap;
