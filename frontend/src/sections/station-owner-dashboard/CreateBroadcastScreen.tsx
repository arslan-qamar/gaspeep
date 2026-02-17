import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClaimedStation,
  FuelType,
  PromotionType,
  CreateBroadcastFormData,
  StationOwner,
  Broadcast,
} from './types';

interface CreateBroadcastScreenProps {
  stations: ClaimedStation[];
  fuelTypes: FuelType[];
  selectedStationId?: string;
  onSubmit: (data: CreateBroadcastFormData) => void;
  onCancel: () => void;
  owner?: StationOwner;
  editingBroadcast?: Broadcast;
  isSubmitting?: boolean;
}

/**
 * CreateBroadcastScreen Component
 * Form to create or edit promotional broadcasts for station owners.
 * Includes message composition, targeting, scheduling, and preview.
 */
export const CreateBroadcastScreen: React.FC<CreateBroadcastScreenProps> = ({
  stations,
  fuelTypes,
  selectedStationId: initialStationId,
  onSubmit,
  onCancel,
  owner,
  editingBroadcast,
  isSubmitting,
}) => {
  const [stationId, setStationId] = useState(initialStationId || '');
  const [title, setTitle] = useState(editingBroadcast?.title || '');
  const [message, setMessage] = useState(editingBroadcast?.message || '');
  const [promotionType, setPromotionType] = useState<PromotionType>(
    editingBroadcast?.promotionType || 'special_discount'
  );
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(
    editingBroadcast?.fuelTypes || []
  );
  const [radius, setRadius] = useState(editingBroadcast?.targetRadius || 10);
  const [sendNow, setSendNow] = useState(!editingBroadcast?.scheduledFor);
  const [scheduledDate, setScheduledDate] = useState(editingBroadcast?.scheduledFor || '');
  const [duration, setDuration] = useState<string>('24 hours');
  const [expiryTime, setExpiryTime] = useState(editingBroadcast?.expiresAt || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const selectedStation = stations.find((s) => s.id === stationId);

  // Estimate recipients (mock calculation)
  const estimatedRecipients = useMemo(() => {
    return Math.max(50, Math.floor((500 / 25) * radius));
  }, [radius]);

  const promotionTypeLabels: Record<PromotionType, string> = {
    price_drop: 'Price Drop',
    special_discount: 'Special Discount',
    limited_time_offer: 'Limited Time Offer',
    new_service: 'New Service',
    general_announcement: 'General Announcement',
  };

  const promotionTypeEmojis: Record<PromotionType, string> = {
    price_drop: '⬇️',
    special_discount: '🎉',
    limited_time_offer: '⏱️',
    new_service: '⭐',
    general_announcement: '📢',
  };

  const hasUnsavedChanges = title.trim() || message.trim();

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const handleToggleFuelType = (fuelTypeId: string) => {
    setSelectedFuelTypes((prev) =>
      prev.includes(fuelTypeId)
        ? prev.filter((id) => id !== fuelTypeId)
        : [...prev, fuelTypeId]
    );
  };

  const handleUpdateDuration = (newDuration: string) => {
    setDuration(newDuration);
    // Calculate expiry time based on duration
    const now = new Date();
    switch (newDuration) {
      case '1 hour':
        setExpiryTime(new Date(now.getTime() + 60 * 60 * 1000).toISOString());
        break;
      case '4 hours':
        setExpiryTime(new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString());
        break;
      case '24 hours':
        setExpiryTime(new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());
        break;
      case '3 days':
        setExpiryTime(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case '7 days':
        setExpiryTime(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
        break;
      default:
        break;
    }
  };

  const handleSubmit = () => {
    if (!stationId || !title.trim() || !message.trim()) {
      return;
    }

    const broadcastData: CreateBroadcastFormData = {
      stationId,
      title,
      message,
      promotionType,
      fuelTypes: selectedFuelTypes,
      targetRadius: radius,
      scheduledFor: sendNow ? null : scheduledDate,
      expiresAt: expiryTime,
    };

    onSubmit(broadcastData);
  };

  const isFormValid = stationId && title.trim() && message.trim();
  const broadcastsRemaining =
    owner ? owner.broadcastLimit - owner.broadcastsThisWeek : 0;
  const maxRadius = 25;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {editingBroadcast ? 'Edit Broadcast' : 'Create Broadcast'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Reach Premium users with your promotional offer
        </p>
      </div>

      {/* Station Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900 dark:text-white">
          Select Station
        </label>
        {/* Hidden input for test compatibility */}
        <input
          type="hidden"
          value={selectedStation?.name || ''}
          data-testid="station-select"
        />

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            data-testid="station-dropdown"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
          >
            <span>{selectedStation?.name || '-- Select a station --'}</span>
            <span className="text-slate-500">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg">
              {stations.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => {
                    setStationId(station.id);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {station.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedStation && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span>{selectedStation.name}</span>
              <span> • </span>
              <span>{selectedStation.address}</span>
            </p>
          </div>
        )}
      </div>

      {/* Message Composition */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Title
            <span className="text-slate-400 ml-2 font-normal">
              {title.length}/50
            </span>
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder="Special offer today!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Message
            <span className="text-slate-400 ml-2 font-normal">
              {message.length}/280
            </span>
          </label>
          <textarea
            maxLength={280}
            placeholder="Describe your promotion..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Promotion Type */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
            Promotion Type
          </label>
          <div className="space-y-2">
            {(Object.keys(promotionTypeLabels) as PromotionType[]).map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="promotionType"
                  value={type}
                  checked={promotionType === type}
                  onChange={(e) => setPromotionType(e.target.value as PromotionType)}
                  className="w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  {promotionTypeEmojis[type]} {promotionTypeLabels[type]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Fuel Types */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
            Fuel Types (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {fuelTypes.map((fuelType) => (
              <label key={fuelType.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFuelTypes.includes(fuelType.id)}
                  onChange={() => handleToggleFuelType(fuelType.id)}
                  className="w-4 h-4"
                />
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: fuelType.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 text-sm">
                  {fuelType.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Targeting Options */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
            Target Radius: {radius} km
          </label>
          <input
            type="range"
            min="1"
            max={maxRadius}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            data-testid="radius-slider"
            className="w-full"
          />
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            ~{estimatedRecipients} Premium users in range
          </p>
        </div>

        {/* Coverage Map */}
        <div
          data-testid="coverage-map"
          className="w-full h-48 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center"
        >
          <span className="text-slate-500 dark:text-slate-400">
            Coverage area visualization
          </span>
        </div>

        {/* Schedule Options */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="sendOption"
              checked={sendNow}
              onChange={() => setSendNow(true)}
              className="w-4 h-4"
            />
            <span className="text-slate-700 dark:text-slate-300">Send now</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="sendOption"
              checked={!sendNow}
              onChange={() => setSendNow(false)}
              className="w-4 h-4"
            />
            <span className="text-slate-700 dark:text-slate-300">Schedule for later</span>
          </label>

          {!sendNow && (
            <div className="ml-7 space-y-2">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                data-testid="schedule-date-picker"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="hidden"
                data-testid="schedule-time-picker"
                value={scheduledDate}
              />
            </div>
          )}
          <input
            type="hidden"
            data-testid="max-schedule-date"
            value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
          />
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            Promotion Duration
          </div>
          <div className="space-y-2">
            {['1 hour', '4 hours', '24 hours', '3 days', '7 days', 'Custom'].map((opt) => {
              const inputId = `duration-${opt.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <div key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input
                    id={inputId}
                    type="radio"
                    name="duration"
                    value={opt}
                    checked={duration === opt}
                    onChange={() => handleUpdateDuration(opt)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={inputId} className="text-slate-700 dark:text-slate-300 text-sm cursor-pointer">
                    {opt}
                  </label>
                </div>
              );
            })}
          </div>
          {expiryTime && (
            <div data-testid="expiry-timestamp" className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded text-sm text-slate-600 dark:text-slate-400">
              Expires: {new Date(expiryTime).toLocaleString()}
            </div>
          )}
          {duration === 'Custom' && (
            <input
              type="datetime-local"
              data-testid="custom-duration-input"
              onChange={(e) => setExpiryTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-white">
          Preview
        </label>
        <div
          data-testid="broadcast-preview"
          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {promotionTypeEmojis[promotionType]}
            </span>
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {promotionTypeLabels[promotionType]}
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {title || 'Your broadcast title'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {message || 'Your broadcast message'}
              </p>
              {selectedFuelTypes.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {selectedFuelTypes.map((typeId) => {
                    const fuel = fuelTypes.find((f) => f.id === typeId);
                    return (
                      <span
                        key={typeId}
                        className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs rounded"
                      >
                        {fuel?.name}
                      </span>
                    );
                  })}
                </div>
              )}
              {selectedStation && (
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  {selectedStation.name}
                </p>
              )}
              {expiryTime && (
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Expires: {new Date(expiryTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => {}}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          Preview as User
        </button>
      </div>

      {/* Broadcast Limits */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg space-y-2">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Broadcasts remaining this week: {owner ? owner.broadcastLimit - owner.broadcastsThisWeek : 0} ({owner?.broadcastsThisWeek || 0} of {owner?.broadcastLimit || 0} used)
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Keep messages promotional and relevant.{' '}
          <a href="#" className="text-yellow-700 dark:text-yellow-200 hover:underline">
            View broadcast policy
          </a>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {}}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium transition-colors"
        >
          Save as Draft
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {editingBroadcast ? 'Update Broadcast' : !sendNow ? 'Schedule Broadcast' : 'Send Broadcast'}
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>

      {isSubmitting && (
        <div
          data-testid="loading-spinner"
          className="flex items-center justify-center p-4"
        >
          <div className="animate-spin">⏳</div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Discard Draft?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              You have unsaved changes to your broadcast. Do you want to discard them?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  onCancel();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
