import React, { useEffect, useMemo, useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';

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

interface MultiSelectDropdownOption {
  id: string;
  label: string;
}

interface FilterModalProps {
  isOpen: boolean;
  filters: FilterState;
  fuelTypeOptions: FuelTypeOption[];
  brandOptions: string[];
  selectedBrands: string[];
  onFiltersChange: (filters: FilterState) => void;
  onSelectedBrandsChange: (brands: string[]) => void;
  onClose: () => void;
}

interface MultiSelectDropdownProps {
  title: string;
  options: MultiSelectDropdownOption[];
  selectedValues: string[];
  onToggleValue: (value: string) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  title,
  options,
  selectedValues,
  onToggleValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(`[data-dropdown-root="${title}"]`)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen, title]);

  const selectedCount = selectedValues.length;
  const triggerText = selectedCount > 0 ? `${title} (${selectedCount} selected)` : title;

  return (
    <div className="space-y-2" data-dropdown-root={title}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-left text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm min-h-11 flex items-center justify-between"
      >
        <span>{triggerText}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-2"
          role="menu"
          aria-label={`${title} options`}
        >
          {options.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {options.map((option) => {
                const checked = selectedSet.has(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleValue(option.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 px-2 py-2">No options available</p>
          )}
        </div>
      )}
    </div>
  );
};

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  filters,
  fuelTypeOptions,
  brandOptions,
  selectedBrands,
  onFiltersChange,
  onSelectedBrandsChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [localSelectedBrands, setLocalSelectedBrands] = useState<string[]>(selectedBrands);
  const formatCents = (price: number): string => `${price.toFixed(1)}¢/L`;

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setLocalSelectedBrands(selectedBrands);
    }
  }, [filters, selectedBrands, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onFiltersChange(localFilters);
    onSelectedBrandsChange(localSelectedBrands);
    onClose();
  };

  const handleFuelTypeToggle = (fuelTypeId: string) => {
    const nextFuelTypes = localFilters.fuelTypes.includes(fuelTypeId)
      ? localFilters.fuelTypes.filter((value) => value !== fuelTypeId)
      : [...localFilters.fuelTypes, fuelTypeId];
    setLocalFilters({
      ...localFilters,
      fuelTypes: nextFuelTypes,
    });
  };

  const handleBrandToggle = (brand: string) => {
    const nextBrands = localSelectedBrands.includes(brand)
      ? localSelectedBrands.filter((value) => value !== brand)
      : [...localSelectedBrands, brand];
    setLocalSelectedBrands(nextBrands);
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
            <label className="font-semibold mb-2 block">Fuel Types</label>
            <MultiSelectDropdown
              title="Fuel Types"
              options={fuelTypeOptions.map((fuelType) => ({ id: fuelType.id, label: fuelType.label }))}
              selectedValues={localFilters.fuelTypes}
              onToggleValue={handleFuelTypeToggle}
            />
          </div>

          {/* Brands */}
          <div>
            <label className="font-semibold mb-2 block">Brands</label>
            <MultiSelectDropdown
              title="Brands"
              options={brandOptions.map((brand) => ({ id: brand, label: brand }))}
              selectedValues={localSelectedBrands}
              onToggleValue={handleBrandToggle}
            />
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
