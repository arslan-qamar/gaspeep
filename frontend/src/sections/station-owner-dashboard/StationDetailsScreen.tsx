import React, { useState } from 'react';
import { ClaimedStation, FuelPrice, Broadcast, StationUpdateFormData, DayOfWeek, OperatingHours } from './types';

interface StationDetailsScreenProps {
  station: ClaimedStation;
  fuelPrices: FuelPrice[];
  broadcasts: Broadcast[];
  onSave: (data: StationUpdateFormData) => void;
  onBroadcast: (stationId: string) => void;
  onUnclaim: (stationId: string) => void;
  isLoading?: boolean;
  isSaving?: boolean;
  isEditing?: boolean;
}

const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const amenityLabels: Record<string, string> = {
  carWash: 'Car Wash',
  convenienceStore: 'Convenience Store',
  restrooms: 'Restrooms',
  airPump: 'Air Pump',
  evCharging: 'EV Charging',
  truckAccess: 'Truck Access',
  loyaltyProgram: 'Loyalty Program',
};

/**
 * StationDetailsScreen Component
 * View and edit claimed station information, operating hours, amenities, and broadcast history.
 */
export const StationDetailsScreen: React.FC<StationDetailsScreenProps> = ({
  station,
  fuelPrices,
  broadcasts,
  onSave,
  onBroadcast,
  onUnclaim,
  isLoading,
  isSaving,
  isEditing: initialIsEditing,
}) => {
  const [isEditing, setIsEditing] = useState(initialIsEditing || false);
  const [showUnclaimConfirm, setShowUnclaimConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<StationUpdateFormData>({
    name: station.name,
    phone: station.phone,
    website: station.website,
    operatingHours: station.operatingHours,
    amenities: station.amenities,
  });

  const handleInputChange = (field: keyof Omit<StationUpdateFormData, 'operatingHours' | 'amenities'>, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOperatingHoursChange = (day: DayOfWeek, field: 'open' | 'close' | 'is24Hour', value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              data-testid="skeleton"
              className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const isVerified = station.verificationStatus === 'verified';

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white truncate">
            {station.name}
          </h1>
          <span
            data-testid="verification-badge"
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              isVerified
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : station.verificationStatus === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {isVerified
              ? '✓ Verified'
              : station.verificationStatus === 'pending'
                ? '⏳ Pending Verification'
                : '✕ Rejected'}
          </span>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Station Information Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        {isEditing ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Station Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Brand
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                {station.brand}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Address
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                {station.address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Phone
                </p>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {station.phone}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Website
                </p>
                <a
                  href={station.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  {station.website}
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Operating Hours */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Operating Hours
        </h2>

        {isEditing ? (
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <label className="w-24 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dayLabels[day]}
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.operatingHours[day].is24Hour}
                    onChange={(e) =>
                      handleOperatingHoursChange(day, 'is24Hour', e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">24 Hours</span>
                </label>

                {!formData.operatingHours[day].is24Hour && (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="time"
                      value={formData.operatingHours[day].open}
                      onChange={(e) =>
                        handleOperatingHoursChange(day, 'open', e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                    <span className="text-slate-600 dark:text-slate-400">to</span>
                    <input
                      type="time"
                      value={formData.operatingHours[day].close}
                      onChange={(e) =>
                        handleOperatingHoursChange(day, 'close', e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                )}

                {formData.operatingHours[day].is24Hour && (
                  <div data-testid="operating-hours-disabled" className="text-xs text-slate-500 dark:text-slate-500">
                    Open 24 hours
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {days.map((day) => (
              <div key={day} className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  {dayLabels[day]}
                </span>
                <span className="text-slate-900 dark:text-white">
                  {formData.operatingHours[day].is24Hour
                    ? '24 Hours'
                    : `${formData.operatingHours[day].open} - ${formData.operatingHours[day].close}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Amenities
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(amenityLabels).map(([amenity, label]) => (
            <label
              key={amenity}
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.amenities.includes(amenity)
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="w-4 h-4"
                disabled={!isEditing}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fuel Prices */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Current Fuel Prices
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Community-submitted prices. Last updated: {fuelPrices[0]?.lastUpdated ? new Date(fuelPrices[0].lastUpdated).toLocaleString() : 'N/A'}
        </p>

        <div className="space-y-2">
          {fuelPrices.map((price) => (
            <div key={price.fuelTypeId} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
              <span className="text-slate-700 dark:text-slate-300">
                {price.fuelTypeName}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${price.price.toFixed(2)}/L
              </span>
            </div>
          ))}
        </div>

        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-4">
          Report Incorrect Price
        </button>
      </div>

      {/* Station Photos */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Station Photos
        </h2>

        {station.photos.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No photos yet
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {station.photos.map((photo, idx) => (
              <div
                key={idx}
                data-testid="photo-thumbnail"
                className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center"
              >
                <img
                  src={photo}
                  alt={`Station photo ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        {isEditing && (
          <div>
            <label
              htmlFor="photos"
              className="block px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
            >
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                Upload Photos
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Drag files here or click to browse
              </p>
            </label>
            <input
              id="photos"
              type="file"
              data-testid="photo-file-input"
              multiple
              accept="image/*"
              className="hidden"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Photo guidelines: Clear, professional photos from different angles
            </p>
          </div>
        )}
      </div>

      {/* Broadcast History */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Broadcast History
        </h2>

        {broadcasts.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No broadcasts yet
          </p>
        ) : (
          <div className="space-y-2">
            {broadcasts.slice(0, 5).map((broadcast) => (
              <div
                key={broadcast.id}
                className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded flex justify-between items-center"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  {broadcast.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {new Date(broadcast.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onBroadcast(station.id)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Broadcast Offer
            </button>
            <button
              onClick={() => setShowUnclaimConfirm(true)}
              className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Unclaim Station
            </button>
          </>
        )}
      </div>

      {isSaving && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin">⏳</div>
        </div>
      )}

      {/* Unclaim Confirmation */}
      {showUnclaimConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Unclaim Station?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to unclaim this station? You will lose access to manage broadcasts and station details.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUnclaimConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUnclaim(station.id);
                  setShowUnclaimConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Unclaim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
