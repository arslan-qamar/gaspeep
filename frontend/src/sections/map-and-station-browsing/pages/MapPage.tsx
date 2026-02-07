import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import MapView from '../components/MapView';
import StationDetailSheet from '../components/StationDetailSheet';
import FilterModal, { FilterState } from '../components/FilterModal';
import { Station } from '../types';

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
    lat: 40.7128,
    lng: -74.006,
  });
  const [loading, setLoading] = useState(false);

  // Get user's location
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

  // Fetch stations from API
  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/stations/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            radiusKm: 10,
            fuelTypes: filters.fuelTypes.length > 0 ? filters.fuelTypes : undefined,
            maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setStations(data);
        } else {
          console.error('Failed to fetch stations');
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [userLocation, filters]);

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
    <div className="w-full h-screen flex flex-col">
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
          className="flex items-center gap-2 px-3 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors"
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
