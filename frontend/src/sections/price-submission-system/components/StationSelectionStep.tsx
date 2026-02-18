import React from 'react'
import type { Station, UserLocation, MapViewport } from '../PriceSubmissionForm.types'
import { MapView } from '../../map-and-station-browsing/components/MapView'
import type { Station as MapStation } from '../../map-and-station-browsing/types'

type StationSelectionStepProps = {
  stationQuery: string
  setStationQuery: React.Dispatch<React.SetStateAction<string>>
  showStationDropdown: boolean
  setShowStationDropdown: React.Dispatch<React.SetStateAction<boolean>>
  isLoadingStations: boolean
  nearbyStations: Station[]
  station: Station | null
  selectStation: (station: Station) => void
  userLocation: UserLocation | null
  mapViewport: MapViewport | null
  mapStations: MapStation[]
  mapFocusLocation: { lat: number; lng: number; zoom: number } | null
  onMapStationSelect: (station: MapStation) => void
  setMapViewport: React.Dispatch<React.SetStateAction<MapViewport | null>>
  onContinue: () => void
}

export const StationSelectionStep: React.FC<StationSelectionStepProps> = ({
  stationQuery,
  setStationQuery,
  showStationDropdown,
  setShowStationDropdown,
  isLoadingStations,
  nearbyStations,
  station,
  selectStation,
  userLocation,
  mapViewport,
  mapStations,
  mapFocusLocation,
  onMapStationSelect,
  setMapViewport,
  onContinue,
}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Search Station</h2>

    <div className="relative">
      <input
        type="text"
        value={stationQuery}
        onChange={(e) => {
          setStationQuery(e.target.value)
          setShowStationDropdown(true)
        }}
        onFocus={() => setShowStationDropdown(true)}
        onBlur={() => {
          window.setTimeout(() => setShowStationDropdown(false), 150)
        }}
        placeholder="Search station by name or address"
        className="w-full py-2 pl-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
      {stationQuery.trim().length > 0 && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setStationQuery('')
            setShowStationDropdown(true)
          }}
          aria-label="Clear station search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <span aria-hidden="true" className="text-lg leading-none">&times;</span>
        </button>
      )}

      {showStationDropdown && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {isLoadingStations ? (
            <div className="p-3 text-sm text-slate-600 dark:text-slate-400">Searching stations...</div>
          ) : nearbyStations.length === 0 ? (
            <div className="p-3 text-sm text-slate-600 dark:text-slate-400">No stations matched your search.</div>
          ) : (
            nearbyStations.slice(0, 20).map((s) => {
              const isSelected = s.id === station?.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectStation(s)}
                  className={`w-full border-b border-slate-100 p-3 text-left last:border-b-0 dark:border-slate-800 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{s.address || 'Address unavailable'}</div>
                  {typeof s.distance === 'number' && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">{s.distance.toFixed(1)} km away</div>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>

    <div className="h-80 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
      {userLocation && mapViewport ? (
        <MapView
          stations={mapStations}
          selectedStationId={station?.id}
          focusLocation={mapFocusLocation || undefined}
          onStationSelect={onMapStationSelect}
          userLocation={userLocation}
          onViewportChange={setMapViewport}
          isFetchingMore={isLoadingStations}
        />
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
          Locating nearby stations...
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={onContinue}
      disabled={!station}
      className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
        station
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
      }`}
    >
      Continue to Price Entry
    </button>
  </div>
)
