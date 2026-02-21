import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';

const MAX_PRICE_CENTS_MIN = 0;
const MAX_PRICE_CENTS_MAX = 400;
const MAX_PRICE_CENTS_STEP = 0.1;

export interface FilterState {
  fuelTypes: string[];
  maxPrice: number;
  onlyVerified: boolean;
}

export interface FuelTypeOption {
  id: string;
  label: string;
}

interface FilterModalProps {
  isOpen: boolean;
  filters: FilterState;
  fuelTypeOptions: FuelTypeOption[];
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  filters,
  fuelTypeOptions,
  onFiltersChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const formatCents = (price: number): string => `${price.toFixed(1)}¢/L`;

  if (!isOpen) return null;

  const handleFuelTypeToggle = (fuelTypeId: string) => {
    setLocalFilters({
      ...localFilters,
      fuelTypes: localFilters.fuelTypes.includes(fuelTypeId)
        ? localFilters.fuelTypes.filter((id) => id !== fuelTypeId)
        : [...localFilters.fuelTypes, fuelTypeId],
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        data-testid="backdrop"
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <h3 className="font-bold text-lg">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Fuel Types */}
          <div>
            <h4 className="font-semibold mb-2">Fuel Types</h4>
            <div className="space-y-2">
              {fuelTypeOptions.map((ft) => (
                <label key={ft.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.fuelTypes.includes(ft.id)}
                    onChange={() => handleFuelTypeToggle(ft.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span>{ft.label}</span>
                </label>
              ))}
              {fuelTypeOptions.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No fuel types available</p>
              )}
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="block font-semibold mb-2">
              Max Price: {formatCents(localFilters.maxPrice)}
            </label>
            <input
              type="range"
              min={MAX_PRICE_CENTS_MIN}
              max={MAX_PRICE_CENTS_MAX}
              step={MAX_PRICE_CENTS_STEP}
              value={localFilters.maxPrice}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  maxPrice: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {/* Verified Only */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.onlyVerified}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  onlyVerified: e.target.checked,
                })
              }
              className="w-4 h-4 rounded"
            />
            <span>Show verified prices only</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
