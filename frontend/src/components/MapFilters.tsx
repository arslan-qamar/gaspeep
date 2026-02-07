import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import type { FuelType } from '../lib/api'

interface MapFiltersProps {
  fuelTypes: FuelType[]
  selectedFuelType?: string
  minPrice?: number
  maxPrice?: number
  radius?: number
  onFuelTypeChange: (fuelTypeId?: string) => void
  onPriceRangeChange: (min?: number, max?: number) => void
  onRadiusChange: (radius: number) => void
}

export function MapFilters({
  fuelTypes,
  selectedFuelType,
  minPrice,
  maxPrice,
  radius = 10,
  onFuelTypeChange,
  onPriceRangeChange,
  onRadiusChange,
}: MapFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localMinPrice, setLocalMinPrice] = useState<string>(
    minPrice?.toString() || ''
  )
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(
    maxPrice?.toString() || ''
  )

  const handleApplyPriceFilter = () => {
    const min = localMinPrice ? parseFloat(localMinPrice) : undefined
    const max = localMaxPrice ? parseFloat(localMaxPrice) : undefined
    onPriceRangeChange(min, max)
  }

  const handleClearFilters = () => {
    onFuelTypeChange(undefined)
    onPriceRangeChange(undefined, undefined)
    onRadiusChange(10)
    setLocalMinPrice('')
    setLocalMaxPrice('')
  }

  const activeFilterCount = [
    selectedFuelType,
    minPrice,
    maxPrice,
    radius !== 10,
  ].filter(Boolean).length

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-[9998] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Filter Content */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-[calc(100vh-100px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Fuel Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type
                </label>
                <select
                  value={selectedFuelType || ''}
                  onChange={(e) =>
                    onFuelTypeChange(e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Fuel Types</option>
                  {fuelTypes.map((fuelType) => (
                    <option key={fuelType.id} value={fuelType.id}>
                      {fuelType.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (per liter)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={handleApplyPriceFilter}
                  className="mt-2 w-full px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                >
                  Apply Price Filter
                </button>
              </div>

              {/* Radius Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius: {radius} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radius}
                  onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Active Filters
                    </span>
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFuelType && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {
                          fuelTypes.find((ft) => ft.id === selectedFuelType)
                            ?.displayName
                        }
                        <button
                          onClick={() => onFuelTypeChange(undefined)}
                          className="ml-1 hover:text-indigo-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        ${minPrice || '0'} - ${maxPrice || '∞'}
                        <button
                          onClick={() => {
                            onPriceRangeChange(undefined, undefined)
                            setLocalMinPrice('')
                            setLocalMaxPrice('')
                          }}
                          className="ml-1 hover:text-indigo-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {radius !== 10 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Radius: {radius} km
                        <button
                          onClick={() => onRadiusChange(10)}
                          className="ml-1 hover:text-indigo-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
