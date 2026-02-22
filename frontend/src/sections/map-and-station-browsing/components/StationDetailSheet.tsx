import React, { useEffect, useRef } from 'react';
import { X, Clock, MapPin, Fuel } from 'lucide-react';
import { Station } from '../types';

interface StationDetailSheetProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrice?: (stationId: string, fuelTypeId: string) => void;
}

export const StationDetailSheet: React.FC<StationDetailSheetProps> = ({
  station,
  isOpen,
  onClose,
  onSubmitPrice,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const updatePriceButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  const formatPriceInCents = (price: number): string => `${price.toFixed(1)}¢`;

  const formatLastUpdated = (lastUpdated?: string): string | null => {
    if (!lastUpdated) return null;

    const parsedDate = new Date(lastUpdated);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return parsedDate.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  useEffect(() => {
    if (!isOpen || !station) return;

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    updatePriceButtonRef.current?.focus();
    if (document.activeElement !== updatePriceButtonRef.current) {
      closeButtonRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusedElementRef.current?.focus();
    };
  }, [isOpen, station, onClose]);

  if (!isOpen || !station) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        data-testid="backdrop"
      />

      {/* Sheet */}
      <div
        className="relative w-full max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`station-detail-title-${station.id}`}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 id={`station-detail-title-${station.id}`} className="text-xl font-bold">
            {station.name}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Close station details"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin size={20} className="text-slate-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
              <p className="font-medium">{station.address}</p>
            </div>
          </div>

          {/* Hours */}
          {station.operatingHours && (
            <div className="flex items-start gap-2">
              <Clock size={20} className="text-slate-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Hours</p>
                <p className="font-medium">{station.operatingHours}</p>
              </div>
            </div>
          )}

          {/* Fuel Prices */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Fuel size={20} />
              Current Prices
            </h3>
            <div className="space-y-2">
              {station.prices.length > 0 ? (
                station.prices.map((price) => {
                  const formattedLastUpdated = formatLastUpdated(price.lastUpdated);

                  return (
                    <div key={price.fuelTypeId} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{price.fuelTypeName}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {price.verified ? '✓ Verified' : 'Unverified'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatPriceInCents(price.price)}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            per litre
                          </p>
                        </div>
                      </div>
                      {formattedLastUpdated && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Last updated {formattedLastUpdated}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">
                  No price data available
                </p>
              )}
            </div>
          </div>

          {/* Submit Price Button */}
          <button
            ref={updatePriceButtonRef}
            type="button"
            onClick={() => {
              if (station.prices.length > 0) {
                onSubmitPrice?.(station.id, station.prices[0].fuelTypeId);
              } else {
                onSubmitPrice?.(station.id, '');
              }
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Update Price
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationDetailSheet;
